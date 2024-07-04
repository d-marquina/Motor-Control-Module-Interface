/**
 * To strictly type all accessors and writers, remove
 *
 * [messageID: string]: any
 *
 * And replace with your entire state shape after codecs have decoded them.
 */
declare global {
  interface ElectricUIDeveloperState {
    [messageID: string]: any

    // Example messageID typings
    led_blink: number
    led_state: number
    lit_time: number
    MCM_angle: number
    MCM_en_mot: number
    MCM_mot_sp: number
    MCM_ustep: number
    MCM_pid_mode: number
    MCM_set_pt: number
    MCM_tr_n: number
    MCM_tr_d: number
    MCM_b0: number
    MCM_b1: number
    MCM_b2: number
    MCM_a1: number
    MCM_Ts: number

    settings: ModuleSettingsType

  }
  interface ElectricUIDeviceMetadataState {
    name: string
  }
}

// Export custom struct types for use in both codecs and the application
export type LEDSettings = {
  glow_time: number
  enable: number
}

// Module Settings
export type ModuleSettingsType = {
  begin_flag:number
  end_flag: number
  trigger_signal: number
  refresh_rate: number
}

// This exports these types into the dependency tree.
export {}
