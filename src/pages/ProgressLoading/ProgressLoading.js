import React from "react";

import { Progress, Switch } from "antd";

import "antd/dist/antd.css";

import styles from "./progressLoading.less";

/**
 * @description
 * 前10s匀速加载到80%，后20s(即前30s)匀速加载到95%，剩余时间待结束后加载到100%
 * 1. loading大于n2s:
 *    1. 前n1s内，v1匀速加载至80%(v1 = (80/N) s/%)
 *    2. 前n2s内，v2匀速加载至95%(v2 = ((95-80)/(n2-n1) s/%))，停
 *    3. loading结束，n3s内加载剩余
 * 2. loading小于n2s
 *    1. v1及v2匀速加载；
 *    2. loading结束，n3s内加载剩余至完成
 */
class ProgressLoading_DIPRECATED extends React.PureComponent {
  state = {
    fastDuration: 10,
    slowDuration: 30,
    endingDuration: 0.25,
    fastPercent: 80,
    slowPercent: 95,
    curPercent: 0,
  };

  timer1 = 0;
  timer2 = 0;
  timer3 = 0;

  componentDidMount() {
    const { fastDuration, fastPercent } = this.state;

    // 初始化时计时器开始
    this.timer1 = setInterval(() => {
      if (this.state.curPercent < fastPercent) {
        this.setState({
          curPercent: this.state.curPercent + 1,
        });
      } else {
        clearInterval(this.timer1);
        return;
      }
    }, (fastDuration / fastPercent) * 1000); // n1s，v1 = (n1/80)*1000 ms/%
  }

  componentDidUpdate(preProps, preState) {
    const {
      endingDuration,
      fastDuration,
      slowDuration,
      fastPercent,
      slowPercent,
    } = this.state;
    const { loading } = this.props;

    clearInterval(this.timer2);
    if (
      loading &&
      this.state.curPercent >= fastPercent &&
      preState.curPercent < this.state.curPercent
    ) {
      this.timer2 = setInterval(() => {
        if (this.state.curPercent < slowPercent) {
          this.setState({
            curPercent: Number(Number(this.state.curPercent + 0.1).toFixed(1)), // 步幅0.1
          });
        } else if (this.state.curPercent >= slowPercent) {
          clearInterval(this.timer2);
          return;
        }
      }, ((slowDuration - fastDuration) / ((slowPercent - fastPercent) * 10)) * 1000); // n2s，v2 = (n2-n1)/(15*10)*1000 ms/0.1%
    } else if (loading && this.state.curPercent >= slowPercent) {
      clearInterval(this.timer2);
    }

    if (
      preProps.loading &&
      !this.props.loading &&
      this.state.curPercent < 100
    ) {
      const { curPercent } = this.state;
      // 检测到停止后，记录当前percent，计算剩余进度值
      const restPercent = 100 - curPercent;

      clearInterval(this.timer1);
      clearInterval(this.timer2);

      this.timer3 = setInterval(() => {
        this.setState(
          {
            curPercent:
              this.state.curPercent < 100
                ? this.state.curPercent + 1
                : this.state.curPercent,
          },
          () => {
            if (this.state.curPercent > 100) {
              clearInterval(this.timer2);
            }
          }
        );
      }, (endingDuration * 1000) / restPercent);
    } else if (
      preProps.loading &&
      !this.props.loading &&
      this.state.curPercent >= 100
    ) {
      clearInterval(this.timer3);
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

export default ProgressLoading_DIPRECATED;
