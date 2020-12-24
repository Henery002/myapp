import React from "react";
import { Spin } from "antd";
import Progress from "../../ProgressLoading";

class SpinProgress extends React.PureComponent {
  componentWillMount() {
    //
    {
      console.log(Spin.prototype, "Spin-willMount...");
    }
  }

  componentDidUpdate(preProps, preState) {
    //
    console.log(Spin.prototype, "Spin-didUpdate...");
  }

  render() {
    const { children } = this.props;
    return (
      <Spin spinning={1} indicator={<Progress />}>
        {children}
      </Spin>
    );
  }
}

export default SpinProgress;
