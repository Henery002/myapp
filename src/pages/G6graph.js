import React, { PureComponent } from "react";

import G6 from "@antv/g6";

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
          fill: "#e4393c",
          cursor: "pointer",
        },
      },
    },
    drawShape: (cfg, group) => {
      const shape = group.addShape("image", {
        attrs: {},
      });
      // console.log(cfg, group, shape, "registerNode-drawShape...");

      return shape;
    },

    // 动画
    afterDraw: (cfg, group) => {
      const shape = group.get("children")[0];
      // console.log(shape, "afterdraw...");

      shape.animate(
        (ratio) => {
          const diff = ratio <= 0.5 ? ratio * 10 : (1 - ratio) * 10;
          return {
            r: (cfg.size / 2) * diff,
          };
        },
        {
          repeat: true,
          duration: 1000,
          easing: "easeCubic",
        }
      );
    },

    setState: (name, value, node) => {
      // console.log(name, value, node, "node-setState...");
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
      // console.log(this.props.toolBarContainer, "props-ref...");
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

        type: "image",
        img: this.getNodeItemIcon(item.id),
        size: item?.index === "p0" ? 56 : 40,
        // type: "custom-node",
        label: item.label,
        labelCfg: {
          position: "bottom",
        },
      });
    });

    const $toolbar = new G6.ToolBar({
      container: this.props.toolBarContainer?.current ?? "",
      // getContent: () => {
      //   return `
      //     <ul>
      //       <li code="enlarge">放大</li>
      //       <li code="reduce">缩小</li>
      //     </ul>
      //   `;
      // },
      // handleClick: (code, graph) => {
      //   console.log(code, "handleClick...");
      //   if (code === "enlarge") {
      //     //
      //   } else if (code === "reduce") {
      //     //
      //   }
      // },
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
      plugins: [$toolbar],
      nodeStateStyles: {
        hover: {
          size: 50,
        },
      },
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
    $graph.on("node:mouseenter", (ev) => {
      const node = ev.item;
      const edges = node.getEdges();
      edges.forEach((edge) => {
        // 置顶
        edge.toFront();
        edge.getSource().toFront();
        edge.getTarget().toFront();

        // 激活自定义边的状态
        $graph.setItemState(edge, "active", true);
      });
      $graph.paint();
    });

    $graph.on("node:mouseleave", (ev) => {
      const edges = $graph.getEdges();
      edges.forEach((edge) => {
        edge.toBack();
        $graph.setItemState(edge, "active", false);
      });
      $graph.paint();
    });

    $graph.data(dataSource);
    $graph.render();
  };

  render() {
    const { graphWidth, graphHeight } = this.props;
    return (
      <div
        ref={this.graphRef}
        style={{
          width: `${graphWidth}%`,
          height: `${graphHeight}%`,
          background: "#eee",
        }}
      />
    );
  }
}
