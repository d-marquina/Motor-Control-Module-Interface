import {
  ChartContainer,
  LineChart,
  RealTimeDomain,
  TimeAxis,
  VerticalAxis,
  TriggerDomain,
  ZoomBrush,
  useMouseSignal,
  MouseCapture,
  VerticalLineAnnotation,
  HorizontalLineAnnotation,
  PointAnnotation,
  DataSourcePrinter
} from '@electricui/components-desktop-charts'

import { Card, Divider } from '@blueprintjs/core'
import { Box, Composition } from 'atomic-layout'
import { IntervalRequester } from '@electricui/components-core'
import { LightBulb } from '../../components/LightBulb'
import { useMessageDataSource } from '@electricui/core-timeseries'
import { useDataTransformer } from '@electricui/timeseries-react'
import { closestTemporally, filter } from '@electricui/dataflow'
import React from 'react'
import { RouteComponentProps } from '@reach/router'
import { Dropdown, NumberInput, Slider } from '@electricui/components-desktop-blueprint'
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
  const setPointDS = useMessageDataSource('set_pt_stream')
  const settingsDS = useMessageDataSource('settings')

  const triggerDS = useDataTransformer(() => {   
    const eventsAboveThreshold = filter(settingsDS, (data, time) => {
      return data.trigger_signal >= data.refresh_rate - 1
    })   
    return eventsAboveThreshold
  })

  const [mouseSignal, captureRef] = useMouseSignal()
  const closestEvent = useDataTransformer(() => {
    return closestTemporally(angleSensorDS, mouseSignal, data => data.x)
  })

  let UI_msp_rpm = 0

  let PID_mode = 3
  let MCM_Kp = 1
  let MCM_Ki = 1
  let MCM_Kd = 1
  let MCM_Kd_unformatted = 1

  function assign_gains(pid_mode = 0){
    let Kp = 0
    let Ki = 0
    let Kd = 0
    let Kd_unfotmatted = 0
    // P
    if (PID_mode == 0){
      Kp = 1
    }
    // PD
    if (PID_mode == 1){
      Kp = 1
      Kd = 0.001
      Kd_unfotmatted = 1
    }
    //PI
    if (PID_mode == 2){
      Kp = 1
      Ki = 1
    }
    // PID
    if (PID_mode == 3){
      Kp = 1
      Ki = 1
      Kd = 0.001
      Kd_unfotmatted = 1
    }
    return [Kp, Ki, Kd, Kd_unfotmatted]
  }

  function calculate_coeff(Ts_ms = 10){
    let b0 = 0
    let b1 = 0
    let b2 = 0
    let a1 = 0
    let MCM_Ts = Ts_ms/1000
    // P
    if (PID_mode == 0){
      b0 = MCM_Kp
    }
    // PD
    if (PID_mode == 1){
      b0 = MCM_Kp + MCM_Kd/MCM_Ts 
      b1 = -MCM_Kd/MCM_Ts
    }
    //PI
    if (PID_mode == 2){
      b0 = 0.5*MCM_Ki*MCM_Ts + MCM_Kp 
      b1 = 0.5*MCM_Ki*MCM_Ts - MCM_Kp
      a1 = 1
    }
    // PID
    if (PID_mode == 3){
      b0 = 0.5*MCM_Ki*MCM_Ts + MCM_Kp + MCM_Kd/MCM_Ts
      b1 = 0.5*MCM_Ki*MCM_Ts - MCM_Kp -2*MCM_Kd/MCM_Ts
      b2 = MCM_Kd/MCM_Ts
      a1 = 1
    }
    return [b0, b1, b2, a1]
  }

  function zeroUIMotorSpeed(driver_state = 0){
    if (driver_state === 0){
      UI_msp_rpm = 0
    }
  }

  return (
    <React.Fragment>
      <IntervalRequester interval={200} variables={['led_state']} />
      <IntervalRequester interval={200} variables={['MCM_angle']} />
      {/*<IntervalRequester interval={200} variables={['MCM_en_mot']}/>
      <IntervalRequester interval={200} variables={['MCM_mot_sp']}/>
      <IntervalRequester interval={200} variables={['MCM_pid_mode']}/>
      <IntervalRequester interval={200} variables={['MCM_set_pt']}/>
      <IntervalRequester interval={200} variables={['MCM_b0']}/>
      <IntervalRequester interval={200} variables={['MCM_b1']}/>
      <IntervalRequester interval={200} variables={['MCM_b2']}/>
      <IntervalRequester interval={200} variables={['MCM_a1']}/>
      <IntervalRequester interval={200} variables={['MCM_Ts']}/>*/}

      <Composition areas={layoutDescription} gap={10} templateCols="2fr 3fr">
        {Areas => (
          <React.Fragment>

            <Areas.Slider>
              <Composition height={"64vh"} paddingVertical={"1vh"}>
                <Card >
                  <Box  paddingVertical={"1vh"}>                    
                    <Composition templateCols="1fr 1fr" height={"4vh"} paddingHorizontal={"1vw"}>
                      <Switch
                        unchecked={0}
                        checked={1}
                        accessor={state => state.MCM_en_mot}
                        writer={(state, value) => {
                          state.MCM_en_mot = value,
                          zeroUIMotorSpeed(value)
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
                  </Box>

                  <Divider/>

                  <Box  paddingVertical={"1vh"}>
                    <Composition gapRow={"1vh"} height={"10vh"} paddingHorizontal={"1vw"}>
                      <Box>
                        <Composition templateCols='3fr 2fr'>
                          <p> Set manual motor speed [RPM]:</p>
                            <Composition justifyContent='end'>
                              <Dropdown
                                accessor={state => state.MCM_ustep} 
                                placeholder={selectedOption =>
                                  selectedOption ? `${selectedOption.text}` : 'Select Microsteps'
                                }
                                writer={(state,value) => {
                                  state.MCM_ustep = value,
                                  state.MCM_mot_sp = UI_msp_rpm * state.MCM_ustep / 0.3
                                }}>
                                <Dropdown.Option value={1} text="Full steps"/>
                                <Dropdown.Option value={2} text="1/2 steps"/>
                                <Dropdown.Option value={4} text="1/4 steps"/>
                                <Dropdown.Option value={8} text="1/8 steps"/>
                                <Dropdown.Option value={16} text="1/16 steps"/>
                                <Dropdown.Option value={32} text="1/32 steps"/>
                              </Dropdown>
                            </Composition>
                        </Composition>
                        <Slider
                          min={0}
                          max={210}
                          stepSize={10}
                          labelStepSize={30}
                          sendOnlyOnRelease
                          writer={(state, values) => {
                            UI_msp_rpm = values.UI_motor_speed_at_RPM,
                            state.MCM_mot_sp = UI_msp_rpm * state.MCM_ustep / 0.3                          
                          }}
                        >
                          <Slider.Handle
                            name="UI_motor_speed_at_RPM"
                            accessor={state => UI_msp_rpm}/>
                        </Slider>
                      </Box>
                    </Composition>     
                  </Box>

                  <Divider/>

                  <Box paddingVertical={"1vh"} paddingHorizontal={"1vw"}>
                    <Composition gapRow={"1vh"} height={"10vh"}>
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
                    </Composition>
                  </Box>

                  <Divider/>

                  <Box>
                    <Composition templateCols="5fr 3fr" gapRow={"1vh"} paddingTop={"1vh"} paddingHorizontal={"1vw"} height={"24vh"}>
                      
                      <Box row={1} col={1}>
                        <Composition  templateCols="5fr 3fr" alignItems='center'>
                          <p>Select controller type:</p>
                          <Composition justifyItems='end'>
                            <Dropdown
                              accessor={state => PID_mode} 
                              placeholder={selectedOption =>
                                selectedOption ? `${selectedOption.text}` : 'Select Mode'
                              }
                              writer={(state,value) => {
                                PID_mode = value,
                                [state.MCM_b0, state.MCM_b1, state.MCM_b2, state.MCM_a1] = calculate_coeff(state.MCM_Ts)
                              }}>
                              <Dropdown.Option value={0} text="P"/>
                              <Dropdown.Option value={1} text="PD"/>
                              <Dropdown.Option value={2} text="PI"/>
                              <Dropdown.Option value={3} text="PID"/>
                            </Dropdown>
                          </Composition>
                        </Composition>                          
                      </Box>
                      
                      <Box row={2} col={1}>
                        <Composition templateCols="1fr 3fr" alignItems='end'>
                          <p>Ts [ms]</p>
                          <Composition justifyItems='end'>
                            <Printer accessor={"MCM_Ts"}/>
                          </Composition>
                        </Composition>                          
                      </Box>

                      <Box row={3} col={1}>
                        <Composition templateCols="1fr 3fr" alignItems='end'>
                          <p>Kp</p>
                          <Composition justifyItems='end'>
                            <NumberInput
                              accessor={state => MCM_Kp}
                              writer={(state, value) => {
                                MCM_Kp = value,
                                [state.MCM_b0, state.MCM_b1, state.MCM_b2, state.MCM_a1] = calculate_coeff(state.MCM_Ts)
                              }}
                            />
                          </Composition>
                        </Composition>                          
                      </Box>

                      <Box row={4} col={1}>
                        <Composition templateCols="1fr 3fr" alignItems='end'>
                          <p>Ki</p>
                          <Composition justifyItems='end'>
                            <NumberInput
                              accessor={state => MCM_Ki}
                              writer={(state, value) => {
                                MCM_Ki = value,
                                [state.MCM_b0, state.MCM_b1, state.MCM_b2, state.MCM_a1] = calculate_coeff(state.MCM_Ts)
                              }}
                            />
                          </Composition>
                        </Composition>                          
                      </Box>

                      <Box row={5} col={1}>
                        <Composition templateCols="1fr 3fr" alignItems='end'>
                          <p>Kd [/1000]</p>
                          <Composition justifyItems='end'>
                            <NumberInput
                              accessor={state => MCM_Kd_unformatted}
                              writer={(state, value) => {
                                MCM_Kd_unformatted = value,
                                MCM_Kd = value/1000,
                                [state.MCM_b0, state.MCM_b1, state.MCM_b2, state.MCM_a1] = calculate_coeff(state.MCM_Ts)
                              }}
                            />
                          </Composition>
                        </Composition>                          
                      </Box>                       

                      <Box row={2} col={2}>
                        <Composition templateCols="3fr 1fr" justifyItems='end'>
                          <p>b0:</p>
                          <Printer accessor="MCM_b0"/>
                        </Composition>                          
                      </Box>

                      <Box row={3} col={2}>
                        <Composition templateCols="3fr 1fr" justifyItems='end'>
                          <p>b1:</p>
                          <Printer accessor="MCM_b1"/>
                        </Composition>                          
                      </Box>

                      <Box row={4} col={2}>
                        <Composition templateCols="3fr 1fr" justifyItems='end'>
                          <p>b2:</p>
                          <Printer accessor="MCM_b2"/>
                        </Composition>                          
                      </Box>

                      <Box row={5} col={2}>
                        <Composition templateCols="3fr 1fr" justifyItems='end'>
                          <p>a1:</p>
                          <Printer accessor="MCM_a1"/>
                        </Composition>                          
                      </Box>
                    </Composition>
                  </Box>

                </Card>
              </Composition>
            </Areas.Slider>

            <Areas.Chart1>
              <Composition height={"64vh"} paddingVertical={"1vh"}>
                <Card>
                  <Composition templateCols='2fr 2fr 2fr' paddingBottom={"4vh"}>
                    <Card>
                      <Composition templateCols='2fr 1fr' height={"4vh"} alignContent="center">
                        <Box row={1} col={1}>
                          <p>Measured angle [°]:</p> 
                        </Box>

                        <Box row={1} col={2}>
                          <Printer accessor="MCM_angle"/> 
                        </Box>

                        <Box row={2} col={1}>
                          <p>Measured error [°]:</p>
                        </Box>

                        <Box row={2} col={2}>
                          <Printer accessor={state => state.MCM_set_pt - state.MCM_angle}/> 
                        </Box>
                                         
                      </Composition>
                    </Card>

                    <Card>
                      <Composition templateCols='2fr 1fr' height={"4vh"} alignContent="center">
                        <Box row={1} col={1}>
                          <p>Angle at cursor [°]:</p>
                        </Box>

                        <Box row={1} col={2}>
                          <DataSourcePrinter
                            dataSource={closestEvent}
                            accessor={event => event.data}/>
                        </Box>

                        <Box row={2} col={1}>
                          <p>Time at cursor [ms]:</p>
                        </Box>

                        <Box row={2} col={2}>
                          <DataSourcePrinter
                            dataSource={closestEvent}
                            accessor={event => event.time}/>
                        </Box>
                        
                      </Composition>
                    </Card>

                    <Composition justifyContent='end' height={"6vh"} alignContent='center' >
                      <Switch
                        unchecked={0}
                        checked={1}
                        accessor={state => state.settings.begin_flag}
                        writer={(state,value) => {
                          state.settings.begin_flag = value
                        }}
                      >
                        Record data (10 s)
                      </Switch>
                      <Composition templateCols='1fr 4fr'>
                        <p>n:</p>
                        <NumberInput
                          accessor={state => state.MCM_tr_n}
                          writer={(state, value) => {
                            state.MCM_tr_n = value
                          }}
                        />
                      </Composition>
                      <Composition templateCols='1fr 4fr'>
                        <p>d:</p>
                        <NumberInput
                          accessor={state => state.MCM_tr_d}
                          writer={(state, value) => {
                            state.MCM_tr_d = value
                          }}
                        />
                      </Composition>
                      
                    </Composition>              
                  </Composition>

                  <ChartContainer height={"45vh"}>
                    <LineChart
                      dataSource={angleSensorDS}
                      step='after'    
                    />
                    <LineChart
                      dataSource={setPointDS}
                      step='after'
                    />
                    <RealTimeDomain
                      window={10000}
                      delay={100}
                      yMin={-10}
                      yMax={380}
                    />
                    <TimeAxis label='Time [s]'/>
                    <VerticalAxis
                      label='Angle [°]'
                      labelPadding={50}
                      tickValues={[0, 60, 120, 180, 240, 300, 360]}
                      />
                    <MouseCapture captureRef={captureRef}/>
                    <VerticalLineAnnotation
                      dataSource={mouseSignal}
                      accessor={data => data.x}
                    />
                    <HorizontalLineAnnotation
                      dataSource={mouseSignal}
                      accessor={data => data.y}
                    />
                    <PointAnnotation
                    dataSource={closestEvent}
                    accessor={event => ({x: event.time, y: event.data})}/>
                    
                  </ChartContainer>
                </Card>     
              </Composition>
            </Areas.Chart1>
            
            <Areas.Chart2>
              <Composition paddingVertical={"0.5vh"}>
                <Card>
                  <ChartContainer height={"14vh"}>
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
              </Composition>
              
            </Areas.Chart2>

            
          </React.Fragment>
        )}
      </Composition>
    </React.Fragment>
  )
}
