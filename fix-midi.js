const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    webMidiService.init((event) => {
      if (event.type === 'pad-trigger' && event.padIndex !== undefined) {
        // Need to use the latest pad trigger logic safely - we'll handle this differently or just assume handleTriggerPad works
      }
    });
      if (event.type === 'pad-trigger' && event.padIndex !== undefined) handleTriggerPad(event.padIndex, event.velocity);
    });`;

const replacement = `    webMidiService.init((event) => {
      if (event.type === 'pad-trigger' && event.padIndex !== undefined) {
        // Safe since we just call audioEngine directly inside it
        handleTriggerPad(event.padIndex, event.velocity);
      } else if (event.type === 'cc' && event.controller !== undefined && event.value !== undefined) {
        const lp = learningParamRef.current;
        if (lp) {
          setMidiMappings(prev => ({ ...prev, [lp]: event.controller! }));
          setLearningParam(null);
        } else {
          const m = midiMappingsRef.current;
          if (event.controller === m.master_volume) {
            const vol = event.value;
            setMasterVolume(vol); audioEngine.setMasterVolume(vol);
          } else if (event.controller === m.fx_param) {
            const param = (event.value - 0.5) * 2;
            setFxState(prev => { const next = { ...prev, param }; audioEngine.setFX(next); return next; });
          } else if (event.controller === m.eq_high) {
            const high = (event.value * 30) - 24;
            setEqState(prev => { const next = { ...prev, high }; audioEngine.setEQ(next); return next; });
          } else if (event.controller === m.eq_mid) {
            const mid = (event.value * 30) - 24;
            setEqState(prev => { const next = { ...prev, mid }; audioEngine.setEQ(next); return next; });
          } else if (event.controller === m.eq_low) {
            const low = (event.value * 30) - 24;
            setEqState(prev => { const next = { ...prev, low }; audioEngine.setEQ(next); return next; });
          } else if (event.controller === m.pitch_bend) {
            setTransport(prev => ({ ...prev, pitchBend: (event.value! - 0.5) * 2 * prev.pitchRange }));
          }
        }
      }
    });`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
