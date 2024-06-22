import 'source-map-support/register'

import { deviceManager } from './config'
import { setupProxyAndDebugInterface } from '@electricui/components-desktop-blueprint'
import { setupTransportWindow } from '@electricui/utility-electron'
import {
  ElectronIPCRemoteQueryExecutor,
  Event,
  QueryableMessageIDProvider,
} from '@electricui/core-timeseries'

import './styles.css'

import { FocusStyleManager } from '@blueprintjs/core'
import { SensorInterface, SetPointInterface } from './config/codecs'
import { Message } from '@electricui/core'
FocusStyleManager.onlyShowFocusOnTabs()

const root = document.createElement('div')
document.body.appendChild(root)

const hotReloadHandler = setupProxyAndDebugInterface(root, deviceManager)
setupTransportWindow()

const remoteQueryExecutor = new ElectronIPCRemoteQueryExecutor()
const queryableMessageIDProvider = new QueryableMessageIDProvider(
  deviceManager,
  remoteQueryExecutor,
)

queryableMessageIDProvider.setCustomProcessor('angle_sensor', (message: Message<SensorInterface>, emit) => {
  if (!message.payload) {
    // If there's no payload, do nothing
    return
  }
  // Emit an event with the data 
  emit(new Event(message.payload.timestamp, message.payload.data))
})

queryableMessageIDProvider.setCustomProcessor('set_pt_stream', (message: Message<SetPointInterface>, emit) => {
  if (!message.payload) {
    // If there's no payload, do nothing
    return
  }
  // Emit an event with the data 
  emit(new Event(message.payload.timestamp, message.payload.data))
})

if (module.hot) {
  module.hot.accept('./config', () => hotReloadHandler(root, deviceManager))
}
