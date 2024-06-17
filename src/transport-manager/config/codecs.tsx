import { Codec, Message, MessageMetadata } from '@electricui/core'

import { LEDSettings, ModuleSettingsType } from '../../application/typedState'
import { SmartBuffer } from 'smart-buffer'
import { HardwareMessageRetimer, HardwareTimeBasis } from '@electricui/protocol-binary-codecs'

/**
 * If you are following the hello-blink example, structure use needs to be added.
 * Follow the getting started tutorial for UI development for notes.
 */
export class LEDCodec extends Codec<LEDSettings> {
  filter(message: Message): boolean {
    return message.messageID === 'led'
  }

  encode(payload: LEDSettings) {
    // SmartBuffers automatically keep track of read and write offsets / cursors.
    const packet = new SmartBuffer({ size: 4 })
    packet.writeUInt16LE(payload.glow_time)
    packet.writeUInt8(payload.enable)

    return packet.toBuffer()
  }

  decode(payload: Buffer) {
    const reader = SmartBuffer.fromBuffer(payload)

    const settings: LEDSettings = {
      glow_time: reader.readUInt16LE(),
      enable: reader.readUInt8(),
    }

    return settings
  }
}

/**
 * Sensor codec
 */
export interface SensorInterface{
  timestamp: number
  data: number
}

export class SensorCodec extends Codec<SensorInterface> {
  private retimer: HardwareMessageRetimer

  constructor(timebasis: HardwareTimeBasis) {
    super()
    this.retimer = new HardwareMessageRetimer(timebasis)
  }

  filter(message: Message<any, MessageMetadata>): boolean {
    return message.messageID === 'angle_sensor'
  }

  encode(payload: SensorInterface, message: Message<SensorInterface, MessageMetadata>): Buffer {

    throw new Error('The signal data is read only.')
  }

  decode(payload: Buffer, message: Message<Buffer, MessageMetadata>): SensorInterface{
    const reader = SmartBuffer.fromBuffer(payload)

    const settings: SensorInterface = {
      timestamp: this.retimer.exchange(reader.readUInt32LE()),
      data: reader.readFloatLE(),
    }

    return settings
  }
}

/**
 * Settings Codec
 */
export class ModuleSettingsCodec extends Codec<ModuleSettingsType>{
  filter(message: Message<any, MessageMetadata>): boolean {
    return message.messageID === 'settings'
  }

  encode(payload: ModuleSettingsType, message: Message<ModuleSettingsType, MessageMetadata>): Buffer {
    const packet = new SmartBuffer({ size: 12})
    packet.writeUInt8(payload.begin_flag)
    packet.writeUInt8(payload.end_flag)
    packet.writeUInt16BE(0)
    packet.writeUInt32LE(payload.trigger_signal)
    packet.writeUInt32LE(payload.refresh_rate)

    return packet.toBuffer()
  }

  decode(payload: Buffer, message: Message<Buffer, MessageMetadata>): ModuleSettingsType {
    const reader = SmartBuffer.fromBuffer(payload)

    const settings_data: ModuleSettingsType = {
      begin_flag: reader.readUInt8(),
      end_flag: reader.readUInt8(1),
      trigger_signal: reader.readUInt32LE(4),
      refresh_rate: reader.readUInt32LE(8),
    }

    return settings_data
  }
}