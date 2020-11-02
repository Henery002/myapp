import React, { PureComponent } from "react";

import G6 from "@antv/g6";

export default class G6Graph extends PureComponent {
  constructor(props) {
    super(props);

    this.graphRef = React.createRef();
  }

  componentDidMount() {
    this.getInit();
  }

  getInit = () => {
    const { dataSource } = this.props;

    const graphWidth = this.graphRef?.current?.clientWidth;
    const graphHeight = this.graphRef?.current?.clientHeight;

    console.log(dataSource, graphWidth, graphHeight, "ref - initialize...");

    const nodes = dataSource.nodes;
    nodes.forEach((item) => {
      const { left, top } = item?.style;
      const wPercent = left?.slice(5, 7);
      const wPercentC = left.indexOf("%");
      const wPixel = left.slice(wPercentC + 4, wPercentC + 6);

      const hPercent = top?.slice(5, 7);
      const hPercentC = top.indexOf("%");
      const hPixel = top.slice(hPercentC + 4, hPercentC + 6);

      console.log(wPercent, wPixel, hPercent, hPixel, "wPercent........");
      Object.assign(item, {
        x: (graphWidth * Number(wPercent)) / 100 - Number(wPixel),
        y: (graphHeight * Number(hPercent)) / 100 - Number(hPixel),
      });
    });

    const $graph = new G6.Graph({
      container: this.graphRef.current || "",
      width: this.graphRef.current.clientWidth,
      height: this.graphRef.current.clientHeight,
      defaultEdge: {
        style: {
          stroke: "#ccc",
          lineWidth: 2,
        },
      },
      defaultNode: {
        shape: "circle",
        size: [40],
        color: "#1980ff",
        style: {
          fill: "#ccc",
          lineWidth: 1,
        },
        labelCfg: {
          style: {
            fill: "#333",
            fontSize: 20,
          },
        },
      },
    });

    $graph.read(dataSource);

    console.log(dataSource, "combos...");
  };

  render() {
    return (
      <div
        ref={this.graphRef}
        style={{ width: "100%", height: "100%", background: "#eee" }}
      />
    );
  }
}
