import {
  ChartContainer,
  LineChart,
  RealTimeDomain,
  TimeAxis,
  VerticalAxis,
  TriggerDomain,
  ZoomBrush
} from '@electricui/components-desktop-charts'

import { Card, Divider } from '@blueprintjs/core'
import { Box, Composition } from 'atomic-layout'
import { IntervalRequester } from '@electricui/components-core'
import { LightBulb } from '../../components/LightBulb'
import { useMessageDataSource } from '@electricui/core-timeseries'
import { useDataTransformer } from '@electricui/timeseries-react'
import { filter } from '@electricui/dataflow'
import React from 'react'
import { RouteComponentProps } from '@reach/router'
import { Slider } from '@electricui/components-desktop-blueprint'
import { Printer } from '@electricui/components-desktop'
import { Switch } from '@electricui/components-desktop-blueprint'

/**
 * How to implement custom codec
 * 
 * This works when sending multiple variables at the same time.
 * 
 * First, define a struct in uC's firmware, pay attention to its label, less than 15 characters.
 * Then, add a type in /application/typedState.ts defining packet's members.
 * After that, create a new codec in /transport-manager/config/codecs.tsx, it should decode bytes.
 * Add that codec in /transport-manager/config/serial.tsx.
 * Finally, declare globally your type /application/typedState.ts, using its label!!
 * Import and call that data using the so important label.
 * Apparently, PlatoformIO uses 4 bytes words for ESP32 and Arduino framework, but compressing it one next to the other
 *  - For a struct with uint8, uint8, uint32 and uint32: {UI8|UI8|0|0}|{UI32}|{UI32}
 *  - For a struct with uint8, uint8, uint16: {UI8|UI8|UI16}
 *  - For a struct with uint8, uint16 uint8: {UI8|0|UI16}|{UI8|0|0|0}
 * 
 * How to use timestamp
 * 
 * Follow: https://electricui.com/docs/examples/hardware-timestamping
 * 
 * First, millis() is called on uController.
 * Then, modify the codec to use HardwareMessageRetimer, but your type should be an interface, and it 
 * no loger is listed on declare global, it should be declared on codec.tsx.
 * In serial.tsx, add HardwareTimeBasis.
 * Finally, in index.tsx, create an event.
 * This method only accepts 2 variables inside codec, so, data should be sent as a buffer.
 */

const layoutDescription = `
  Slider Chart1
  Chart2 Chart2
`

export const OverviewPage = (props: RouteComponentProps) => {
  const ledStateDataSource = useMessageDataSource('led_state')
  const angleSensorDS = useMessageDataSource('angle_sensor')
  const settingsDS = useMessageDataSource('settings')

  const triggerDS = useDataTransformer(() => {   
    const eventsAboveThreshold = filter(settingsDS, (data, time) => {
      return data.trigger_signal >= data.refresh_rate - 1
    })   
    return eventsAboveThreshold
  })

  return (
    <React.Fragment>
      <IntervalRequester interval={50} variables={['led_state']} />
      <IntervalRequester interval={50} variables={['MCM_angle']} />
      <IntervalRequester interval={50} variables={['MCM_en_mot']}/>
      <IntervalRequester interval={50} variables={['MCM_mot_sp']}/>
      <IntervalRequester interval={50} variables={['MCM_pid_mode']}/>
      <IntervalRequester interval={50} variables={['MCM_set_pt']}/>

      <Composition areas={layoutDescription} gap={10} templateCols="2fr 3fr">
        {Areas => (
          <React.Fragment>

            <Areas.Slider>
              <Card>
                <Composition height={"55vh"}>

                <Box>
                  <Card>
                    <Composition templateCols="1fr 1fr">
                      <Switch
                        unchecked={0}
                        checked={1}
                        accessor={state => state.MCM_en_mot}
                        writer={(state, value) => {
                          state.MCM_en_mot = value
                        }}
                        large
                        innerLabel="Disabled"
                        innerLabelChecked="Enabled"
                      >
                        Motor Driver
                      </Switch>
                      
                      <Switch
                        unchecked={0}
                        checked={1}
                        accessor={state => state.MCM_pid_mode}
                        writer={(state,value) => {
                          state.MCM_pid_mode = value
                        }}
                        large
                        innerLabel="Disabled"
                        innerLabelChecked="Enabled"
                      >
                        PID Mode
                      </Switch>
                    </Composition>                    
                  </Card>                  
                </Box>

                <Box>
                  <Card>
                    <Composition gapRow={20}>
                      <Box>
                        <p> Set manual motor speed [steps/s]:</p>
                        <Slider
                          min={0}
                          max={1000}
                          stepSize={10}
                          labelStepSize={100}
                          sendOnlyOnRelease
                        >
                          <Slider.Handle accessor="MCM_mot_sp" />
                        </Slider>
                      </Box>
                      
                      <Box>
                        Angle measured [°]: <Printer accessor="MCM_angle" />
                      </Box>
                    </Composition>                    
                  </Card>                
                </Box>

                <Box>
                  <Card>
                    <Composition gapRow={20}>
                      <Box>
                        <p> Select a set point angle [°] (avoid limits):</p>
                        <Slider
                          min={0}
                          max={360}
                          stepSize={10}
                          labelStepSize={60}
                          sendOnlyOnRelease
                        >
                          <Slider.Handle accessor="MCM_set_pt" />
                        </Slider>
                      </Box>
                  
                      <Box>
                        <Switch
                          unchecked={0}
                          checked={1}
                          accessor={state => state.settings.begin_flag}
                          writer={(state,value) => {
                            state.settings.begin_flag = value
                          }}
                        >
                          Record data
                        </Switch>
                      </Box>
                    </Composition>
                  </Card>
                </Box>                

                

                </Composition>
              </Card>
            </Areas.Slider>

            <Areas.Chart1>
              <Card>
                <ChartContainer height={"55vh"}>
                  <LineChart
                    dataSource={angleSensorDS}
                    step='after'    
                  />
                  <RealTimeDomain
                    window={10000}
                    delay={100}
                    yMin={-10}
                    yMax={380}
                  />
                  <TimeAxis />
                  <VerticalAxis />
                </ChartContainer>
              </Card>            
            </Areas.Chart1>
            
            <Areas.Chart2>
              <Card>

                <ChartContainer height={"18vh"}>
                  <LineChart
                    dataSource={angleSensorDS}
                    step='after'                
                  />
                  <TriggerDomain
                    window={10000}
                    dataSource={triggerDS}
                    yMin={-10}
                    yMax={380}
                  />
                  <TimeAxis />
                  <VerticalAxis />
                  <ZoomBrush />
                </ChartContainer>

              </Card>
            </Areas.Chart2>

            
          </React.Fragment>
        )}
      </Composition>
    </React.Fragment>
  )
}
