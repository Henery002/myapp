import React, { PureComponent } from "react";
import { Spin } from "antd";

import G6 from "@antv/g6";

import currenttb from "../assets/currenttb.svg";
import nexttb from "../assets/nexttb.svg";
import pretb from "../assets/pretb.svg";

// 处理文本省略
function getEllipsisLabel(label) {
  return label.length > 12
    ? `${label.slice(0, 5)}...${label.slice(
        label.length - 5,
        label.length - 1
      )}`
    : label;
}

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
  // {
  //   options: {
  //     style: {},
  //     stateStyles: {},
  //   },
  //   drawShape: (cfg, group) => {
  //     const shape = group.addShape("image", {
  //       attrs: {},
  //     });
  //     // console.log(cfg, group, shape, "registerNode-drawShape...");

  //     return shape;
  //   },

  //   // 动画
  //   afterDraw: (cfg, group) => {
  //     const shape = group.get("children")[0];
  //     // console.log(shape, "afterdraw...");

  //     shape.animate(
  //       (ratio) => {
  //         const diff = ratio <= 0.5 ? ratio * 10 : (1 - ratio) * 10;
  //         return {
  //           r: (cfg.size / 2) * diff,
  //         };
  //       },
  //       {
  //         repeat: true,
  //         duration: 1000,
  //         easing: "easeCubic",
  //       }
  //     );
  //   },

  //   setState: (name, value, node) => {
  //     // console.log(name, value, node, "node-setState...");
  //   },
  // },
  // "image"
  (cfg) => {
    return `
      <rect
        style={{
          width: ${cfg?.index === "p0" ? "56" : "40"},
          height: ${cfg?.index === "p0" ? "71" : "55"},
        }}
        keyshape="true"
        name="nodeItem"
      >
        <img style={{ img: ${getNodeIcon(cfg?.index)}, cursor: 'pointer' }} />
        <text
          style={{
            textAlign: 'center',
            marginTop: ${cfg?.index === "p0" ? "68" : "52"},
            fill: '#333',
            cursor: 'pointer'
          }}
          name="title"
        >
          ${getEllipsisLabel(cfg.label)}
        </text>
      </rect>
    `;
  },
  "rect"
);

function getNodeIcon(idx) {
  return idx === "p0"
    ? currenttb
    : idx?.includes("p") && idx !== "p0"
    ? pretb
    : idx?.includes("n")
    ? nexttb
    : null;
}

export default class G6Graph extends PureComponent {
  constructor(props) {
    super(props);

    this.graphRef = React.createRef();
  }

  componentDidMount() {
    setTimeout(() => this.getInit(), 500);
  }

  componentDidUpdate(preProps) {
    // console.log(preProps, "didupdate...");
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
    const { nodes, connections } = this.props;

    const graphWidth = this.graphRef?.current?.clientWidth;
    const graphHeight = this.graphRef?.current?.clientHeight;

    // console.log(nodes, connections, "ref - initialize...");

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

        // type: "image",
        // img: this.getNodeItemIcon(item.id),
        // size: item?.index === "p0" ? 56 : 40,
        type: "custom-node",
        // label: item.label,
        // labelCfg: {
        // position: "bottom",
        // },
      });
    });

    const $minimap = new G6.Minimap({
      size: [100, 100],
      className: "minimap",
      type: "delegate",
    });

    const $toolbar = new G6.ToolBar({
      container: this.props.toolBarContainer?.current ?? "",
      getContent: () => {
        return `
          <ul>
            <li code="enlarge">放大</li>
            <li code="reduce">缩小</li>
          </ul>
        `;
      },
      handleClick: (code, graph) => {
        // console.log(code, "handleClick...");

        let zoom = $graph.getZoom();

        if (code === "enlarge") {
          zoom += 0.1;
        } else if (code === "reduce") {
          zoom -= 0.1;
        }
        $graph.zoomTo(zoom);
      },
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
      plugins: [$minimap, $toolbar],
      nodeStateStyles: {
        cursor: "pointer",
      },
      edgeStateStyles: {},
      defaultEdge: {
        type: "custom-edge",
        style: {
          stroke: "#999",
          lineWidth: 1,
          lineAppendWidth: 4,
          endArrow: {
            path: G6.Arrow.vee(8, 8, 0),
            fill: "#999",
          },
          cursor: "pointer",
        },
      },
      defaultNode: {
        // type: "custom-node",
      },
    });

    // 边事件
    $graph.on("edge:mouseenter", (ev) => {
      const edge = ev.item;
      const source = edge.getSource();
      const target = edge.getTarget();
      // 置顶
      edge.toFront();
      source.toFront();
      target.toFront();

      // 激活自定义边的状态
      $graph.setItemState(edge, "active", true);
      $graph.paint();
    });

    $graph.on("edge:mouseleave", (ev) => {
      const edges = $graph.getEdges();
      $graph.setItemState(ev.item, "active", false);
      edges.forEach((edge) => edge.toBack());
      $graph.paint();
    });

    // 节点事件
    $graph.on("node:click", (ev) => {
      const shape = ev.target;
      const node = ev.item;
      // console.log(shape, node, "node-click...");
    });

    $graph.on("node:mouseenter", (ev) => {
      const node = ev.item;

      // 过滤hover自定义的节点
      if (node.destroyed) {
        return;
      }

      const edges = node.getEdges();
      edges.forEach((edge) => {
        // 置顶
        edge.toFront();
        edge.getSource().toFront();
        edge.getTarget().toFront();

        // 激活自定义边的状态
        $graph.setItemState(edge, "active", true);
      });

      // NOTE 添加hover自定义文本节点
      const { id, label, x, y, index } = node.get("model");

      if (label.length > 12) {
        const hoverTxt = {
          id: `${id}-cus`,
          type: "rect",
          label,
          x: x + 20,
          y: y + (index === "p0" ? 81 : 65),
          size: [0, 0],
          style: {
            // fill: "#f00",
            // stroke: "#0f0",
          },
          labelCfg: {
            position: "right",
            offset: 0,
          },
        };

        $graph.addItem("node", hoverTxt);
      }

      $graph.paint();
    });

    $graph.on("node:mouseleave", (ev) => {
      const edges = $graph.getEdges();
      edges.forEach((edge) => {
        edge.toBack();
        $graph.setItemState(edge, "active", false);
      });

      // 清除
      $graph
        ?.findAll(
          "node",
          (nodeEl) => nodeEl && /(-cus)+/g.test(nodeEl.get("model").id)
        )
        ?.forEach((item) => {
          $graph.removeItem(item.get("model").id);
        });

      $graph.paint();
    });

    $graph.data({ nodes, edges: connections });

    // console.log(new Date(), "结束时间");
    console.log(this.props, "props...");
    $graph.render();
  };

  render() {
    const { graphWidth, graphHeight, nodes } = this.props;

    window.onresize = () => {
      const current = this.graphRef?.current;

      // 窗口变化后重绘画布尺寸
      if (current?.clientWidth && current?.clientHeight) {
        this.graph.changeSize(current?.clientWidth, current?.clientHeight);
      }
    };

    return (
      <div
        ref={this.graphRef}
        style={{
          width: `${graphWidth}%`,
          height: `calc(${graphHeight}% - 32px)`,
          background: "#eee",
        }}
      >
        <Spin
          spinning={!nodes?.length}
          style={{
            width: this.graphRef?.current?.clientWidth,
            height: this.graphRef?.current?.clientHeight,
          }}
        />
      </div>
    );
  }
}
