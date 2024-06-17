import {
  ChartContainer,
  LineChart,
  RealTimeDomain,
  TimeAxis,
  VerticalAxis,
} from '@electricui/components-desktop-charts'

import { Card } from '@blueprintjs/core'
import { Composition } from 'atomic-layout'
import { IntervalRequester } from '@electricui/components-core'
import { LightBulb } from '../../components/LightBulb'
import { useMessageDataSource } from '@electricui/core-timeseries'
import React from 'react'
import { RouteComponentProps } from '@reach/router'
import { Slider } from '@electricui/components-desktop-blueprint'
import { Printer } from '@electricui/components-desktop'
import { Switch } from '@electricui/components-desktop-blueprint'

const layoutDescription = `
  Slider Chart1
  Chart2 Chart2
`

export const OverviewPage = (props: RouteComponentProps) => {
  const ledStateDataSource = useMessageDataSource('led_state')
  const angleSensorDS = useMessageDataSource('angle_sensor')

  return (
    <React.Fragment>
      <IntervalRequester interval={50} variables={['led_state']} />
      <IntervalRequester interval={50} variables={['MCM_angle']} />
      <IntervalRequester interval={50} variables={['MCM_test_flag']} />      
      <IntervalRequester interval={50} variables={['MCM_motor_speed']} />

      <Composition areas={layoutDescription} gap={10} autoCols="1fr">
        {Areas => (
          <React.Fragment>

            <Areas.Chart1>
              <Card>
                <ChartContainer height={"20vh"}>
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
                <div style={{ textAlign: 'center', marginBottom: '1em' }}>
                  <b>LED State</b>
                </div>
                <ChartContainer>
                  <LineChart dataSource={ledStateDataSource} />
                  <RealTimeDomain window={10000} />
                  <TimeAxis />
                  <VerticalAxis />
                </ChartContainer>

              </Card>
            </Areas.Chart2>

            <Areas.Slider>
              <Card>
                <div style={{ margin: 20 }}>
                  <Slider
                    min={20}
                    max={1020}
                    stepSize={10}
                    labelStepSize={100}
                    sendOnlyOnRelease
                  >
                    <Slider.Handle accessor="lit_time" />
                  </Slider>
                </div>

                <div>
                  Angulo: <Printer accessor="MCM_angle" />
                </div>

                <div>
                  <Switch
                    unchecked={0}
                    checked={10}
                    accessor={state => state.MCM_test_flag}
                    writer={(state, value) => {
                      state.MCM_test_flag = value
                    }}
                  >
                    Toggle Motor State
                  </Switch>
                </div>

                <div>
                  <Slider
                    min={0}
                    max={1000}
                    stepSize={10}
                    labelStepSize={100}
                    sendOnlyOnRelease
                  >
                    <Slider.Handle accessor="MCM_motor_speed" />
                  </Slider>
                </div>

              </Card>
            </Areas.Slider>
          </React.Fragment>
        )}
      </Composition>
    </React.Fragment>
  )
}
