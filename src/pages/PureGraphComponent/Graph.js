import React, { PureComponent } from "react";

import G6 from "@antv/g6";

import currenttb from "./assets/currenttb.svg";
import nexttb from "./assets/nexttb.svg";
import pretb from "./assets/pretb.svg";

G6.registerEdge(
  "custom-edge",
  {
    setState: (name, value, item) => {
      const group = item.getContainer();
      const shape = group.get("children")[0];
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

G6.registerNode(
  "custom-node",
  {
    options: {
      style: {},
      stateStyles: {},
    },
    drawShape: (cfg, group) => {
      const shape = group.addShape("image", {
        attrs: {},
      });

      return shape;
    },

    afterDraw: (cfg, group) => {
      const shape = group.get("children")[0];

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

    setState: (name, value, node) => {},
  },
  "image"
);

export default class G6Graph extends PureComponent {
  constructor(props) {
    super(props);

    this.graphRef = React.createRef();
  }

  componentDidMount() {
    setTimeout(() => this.getInit(), 500);
  }

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

    nodes.forEach((item) => {
      const { left, top } = item?.style;
      const wPercent = left?.slice(5, 7);
      const wPercentC = left.indexOf("%");
      const wPixel = left.slice(wPercentC + 4, wPercentC + 6);

      const hPercent = top?.slice(5, 7);
      const hPercentC = top.indexOf("%");
      const hPixel = top.slice(hPercentC + 4, hPercentC + 6);

      Object.assign(item, {
        x: (graphWidth * Number(wPercent)) / 100 - Number(wPixel),
        y: (graphHeight * Number(hPercent)) / 100 - Number(hPixel),

        type: "image",
        img: this.getNodeItemIcon(item.id),
        size: item?.index === "p0" ? 56 : 40,
        label: item.label,
        labelCfg: {
          position: "bottom",
        },
      });
    });

    const $minimap = new G6.Minimap({
      size: [100, 100],
      className: "minimap",
      type: "delegate",
    });

    const $graph = new G6.Graph({
      container: this.graphRef.current || "",
      width: this.graphRef.current.clientWidth,
      height: this.graphRef.current.clientHeight,
      fitCenter: true,
      autoPaint: true,
      modes: {
        default: ["drag-canvas", "zoom-canvas"],
        edit: ["click-select"],
      },
      plugins: [$minimap],
      nodeStateStyles: {
        cursor: "pointer",
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
    });

    $graph.on("edge:mouseenter", (ev) => {
      const edge = ev.item;
      const source = edge.getSource();
      const target = edge.getTarget();
      edge.toFront();
      source.toFront();
      target.toFront();

      $graph.setItemState(edge, "active", true);
      $graph.paint();
    });

    $graph.on("edge:mouseleave", (ev) => {
      const edges = $graph.getEdges();
      $graph.setItemState(ev.item, "active", false);
      edges.forEach((edge) => edge.toBack());
      $graph.paint();
    });

    $graph.on("node:mouseenter", (ev) => {
      const node = ev.item;
      const edges = node.getEdges();
      edges.forEach((edge) => {
        edge.toFront();
        edge.getSource().toFront();
        edge.getTarget().toFront();

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

    $graph.data({ nodes, edges: connections });

    $graph.render();
  };

  render() {
    const { graphWidth, graphHeight } = this.props;

    console.log(graphWidth, graphHeight, "props...");
    return (
      <div
        ref={this.graphRef}
        style={{
          width: graphWidth,
          height: graphHeight,
        }}
      />
    );
  }
}
