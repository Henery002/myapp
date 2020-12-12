import React from "react";

import { Progress, Switch } from "antd";

import "antd/dist/antd.css";

import styles from "./progressLoading.less";

let timer1 = 0;
let timer2 = 0;

/**
 * @description
 * 1. loading大于Ns:
 *    1. 前Ns内，匀速加载至90%(即(90/N)%/s)；
 *    2. 超过Ns部分，停在90%；
 *    3. 在loading正式结束后，给0.5s时间加载剩余的10%；
 * 2. loading小于Ns，如: 8s:
 *    1. 先以(90/N)%/s的速度运行；
 *    2. 检测到loading结束后，再给0.5s加载剩余全部
 * @description
 * 1211与UI最新沟通，前10s匀速加载到80%，后20s(即前30s)匀速加载到95%，剩余时间待结束后加载到100%
 */
class ProgressLoading extends React.PureComponent {
  state = {
    baseDuration: 10, // loading进度基准时间1
    // mostDuration: 10, // loading进度基准时间1
    // servealDuration: 20, // loading进度基准时间2
    curPercent: 0, // 实时进度
    stagePercent: 80, // loading阶段性进度1
    // severalPercent: 95, // loading阶段性进度2
    speedUpDuration: 1, // loading完成前的冲刺阶段时间
  };

  componentDidMount() {
    const { baseDuration, stagePercent } = this.state;

    // 初始化时计时器开始
    timer1 = setInterval(() => {
      if (this.state.curPercent < stagePercent) {
        this.setState({
          curPercent: this.state.curPercent + 1,
        });
      } else {
        clearInterval(timer1);
        return;
      }
    }, (baseDuration / stagePercent) * 1000); // Ns的话，每%的时间为(N/90)*1000
  }

  componentDidUpdate(preProps, preState) {
    const { speedUpDuration } = this.state;
    const { loading } = this.props;

    if (!loading && this.state.curPercent <= 100) {
      const { curPercent } = this.state;
      // 检测到停止后，记录下当前的percent，计算剩余进度值
      // 然后通知定时器在 speedUpDuration s内完成剩余进度值
      const restPercent = 100 - curPercent;
      clearInterval(timer1);

      timer2 = setInterval(() => {
        this.setState(
          {
            curPercent:
              this.state.curPercent < 100
                ? this.state.curPercent + 1
                : this.state.curPercent,
          },
          () => {
            if (this.state.curPercent > 100) {
              clearInterval(timer2);
            }
          }
        );
      }, (speedUpDuration * 1000) / restPercent);
    } else if (!loading && this.state.curPercent > 100) {
      clearInterval(timer1); // ??? 不需要？？？
      clearInterval(timer2);
      return;
    }
  }

  render() {
    const { curPercent } = this.state;
    const { loading, onChange } = this.props;
    return (
      <div className={styles.progress}>
        <Switch
          defaultChecked={loading}
          checked={loading}
          onChange={onChange}
          className={styles.switch}
        />
        <Progress
          type="circle"
          // type="line"
          showInfo
          percent={curPercent}
          width={80}
        />
      </div>
    );
  }
}

export default ProgressLoading;
