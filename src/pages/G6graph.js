import React, { PureComponent } from "react";

import G6 from "@antv/g6";

import registerNode from "./g6/registerNode.js";

import currenttb from "../assets/currenttb.svg";
import nexttb from "../assets/nexttb.svg";
import pretb from "../assets/pretb.svg";

// 注册一个边类型
G6.registerEdge(
  "custom-edge",
  {
    setState: (name, value, item) => {
      const group = item.getContainer();
      const shape = group.get("children")[0];
      // 自定义边样式
      if (name === "active") {
        if (value) {
          shape.attr("stroke", "#1980ff");
          shape.attr("lineWidth", 2);
        } else {
          shape.attr("stroke", "#999");
          shape.attr("lineWidth", 1);
        }
      }
    },
  },
  "cubic-horizontal"
);

// 注册一个节点类型
G6.registerNode(
  "custom-node",
  {
    options: {
      style: {},
      stateStyles: {
        hover: {
          cursor: "pointer",
        },
      },
    },
    drawShape: (cfg, group) => {
      console.log(cfg, group, "registerNode-drawShap...");
    },
  },
  "image"
);

export default class G6Graph extends PureComponent {
  constructor(props) {
    super(props);

    this.graphRef = React.createRef();
  }

  componentDidMount() {
    setTimeout(() => {
      this.getInit();
    }, 400);
  }

  /**
   * 判断节点类型（1-父 | 2-当前 | 3-子）获取图标
   * @param {string} id - 当前节点id
   */
  getNodeItemIcon = (id) => {
    const { relationData } = this.props;

    const curItemType = relationData.find((item) => item.id === id)?.index;
    return curItemType === "p0"
      ? currenttb
      : curItemType?.includes("p") && curItemType !== "p0"
      ? pretb
      : curItemType?.includes("n")
      ? nexttb
      : null;
  };

  getInit = () => {
    const { dataSource } = this.props;

    const graphWidth = this.graphRef?.current?.clientWidth;
    const graphHeight = this.graphRef?.current?.clientHeight;

    console.log(dataSource, graphWidth, graphHeight, "ref - initialize...");

    const nodes = dataSource.nodes;
    nodes.forEach((item) => {
      // 追加x/y数据
      const { left, top } = item?.style;
      const wPercent = left?.slice(5, 7);
      const wPercentC = left.indexOf("%");
      const wPixel = left.slice(wPercentC + 4, wPercentC + 6);

      const hPercent = top?.slice(5, 7);
      const hPercentC = top.indexOf("%");
      const hPixel = top.slice(hPercentC + 4, hPercentC + 6);

      // console.log(wPercent, wPixel, hPercent, hPixel, "wPercent.........");
      Object.assign(item, {
        x: (graphWidth * Number(wPercent)) / 100 - Number(wPixel),
        y: (graphHeight * Number(hPercent)) / 100 - Number(hPixel),

        img: this.getNodeItemIcon(item.id),
        size: item?.index === "p0" ? 56 : 40,
        type: "image",
        label: item.label,
        labelCfg: {
          position: "bottom",
        },
      });
    });

    const $graph = new G6.Graph({
      container: this.graphRef.current || "",
      width: this.graphRef.current.clientWidth,
      height: this.graphRef.current.clientHeight,
      // fitView: true,
      fitCenter: true,
      autoPaint: true,
      modes: {
        default: ["drag-canvas", "zoom-canvas"],
        edit: ["click-select"],
      },
      nodeStateStyles: {},
      edgeStateStyles: {},
      defaultEdge: {
        type: "custom-edge",
        style: {
          stroke: "#999",
          lineWidth: 1,
          lineAppendWidth: 6,
          endArrow: {
            path: G6.Arrow.vee(8, 8, 0),
            fill: "#999",
          },
          cursor: "pointer",
        },
      },
      defaultNode: {
        type: "custom-node",
      },
    });

    registerNode($graph, {});

    // 声明边事件
    $graph.on("edge:mouseenter", (ev) => {
      const edge = ev.item;
      const source = edge.getSource();
      const target = edge.getTarget();
      // 层级置顶
      edge.toFront();
      source.toFront();
      target.toFront();
      $graph.paint();
      $graph.setItemState(edge, "active", true);
    });

    $graph.on("edge:mouseleave", (ev) => {
      const edges = $graph.getEdges();
      $graph.setItemState(ev.item, "active", false);
      edges.forEach((edge) => edge.toBack());
      $graph.paint();
    });

    $graph.data(dataSource);
    $graph.render();
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
