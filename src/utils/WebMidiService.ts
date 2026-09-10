export interface MidiMessageEvent {
  type: 'pad-trigger' | 'transport' | 'cc';
  padIndex?: number;
  velocity?: number;
  controller?: number;
  value?: number;
}

export class WebMidiService {
  private midiAccess: MIDIAccess | null = null;
  private onMessageCallback?: (event: MidiMessageEvent) => void;
  public connectedDeviceNames: string[] = [];
  public isSupported: boolean = typeof navigator !== 'undefined' && !!navigator.requestMIDIAccess;
  public isReady: boolean = false;

  public async init(callback: (event: MidiMessageEvent) => void): Promise<boolean> {
    this.onMessageCallback = callback;

    if (!navigator.requestMIDIAccess) {
      this.isSupported = false;
      this.isReady = true; // Ready for simulated/manual events
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.isSupported = true;
      this.isReady = true;
      this.bindInputs();
      this.midiAccess.onstatechange = () => {
        this.bindInputs();
      };
      return true;
    } catch (e) {
      console.warn('Web MIDI permission / device access deferral:', e);
      this.isReady = true;
      return false;
    }
  }

  /**
   * Allows manually firing a CC event to test or learn without hardware connected
   */
  public simulateCC(controller: number, value: number = 0.75) {
    if (this.onMessageCallback) {
      this.onMessageCallback({
        type: 'cc',
        controller,
        value,
      });
    }
  }

  /**
   * Allows firing a simulated pad trigger
   */
  public simulatePadTrigger(padIndex: number, velocity: number = 1.0) {
    if (this.onMessageCallback) {
      this.onMessageCallback({
        type: 'pad-trigger',
        padIndex,
        velocity,
      });
    }
  }

  private bindInputs() {
    if (!this.midiAccess) return;
    this.connectedDeviceNames = [];

    const inputs = this.midiAccess.inputs.values();
    for (const input of inputs) {
      this.connectedDeviceNames.push(input.name || 'MIDI Device');
      input.onmidimessage = (e) => this.handleMidiMessage(e as unknown as { data: Uint8Array });
    }
  }

  private handleMidiMessage(event: { data?: Uint8Array }) {
    if (!event.data || !this.onMessageCallback) return;
    const [status, data1, data2] = event.data;
    const command = status >> 4;

    // Note On (command 9) with velocity > 0
    if (command === 9 && data2 > 0) {
      let padIndex = -1;
      if (data1 >= 36 && data1 <= 51) {
        padIndex = data1 - 36;
      } else if (data1 >= 60 && data1 <= 75) {
        padIndex = data1 - 60;
      } else if (data1 >= 48 && data1 <= 63) {
        padIndex = data1 - 48;
      } else {
        padIndex = data1 % 16;
      }

      const velocity = data2 / 127;
      this.onMessageCallback({
        type: 'pad-trigger',
        padIndex,
        velocity,
      });
    }

    // CC Messages (command 11)
    if (command === 11) {
      this.onMessageCallback({
        type: 'cc',
        controller: data1,
        value: data2 / 127,
      });
    }
  }
}

export const webMidiService = new WebMidiService();
