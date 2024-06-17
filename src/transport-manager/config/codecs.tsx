import { Codec, Message, MessageMetadata } from '@electricui/core'

import { LEDSettings } from '../../application/typedState'
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