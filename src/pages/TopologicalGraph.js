import React from "react";
import { Tooltip, Spin } from "antd";
// import { debounce } from 'lodash';
import Ellipsis from "ant-design-pro/lib/Ellipsis";
import { Graph, Node, NodeContent } from "jsplumb-react";
import currenttb from "../assets/currenttb.svg";
import nexttb from "../assets/nexttb.svg";
import pretb from "../assets/pretb.svg";

import styles from "./Graph.less";

class TopologicalGraph extends React.PureComponent {
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

  /**
   * Node.children，节点的内容
   */
  children = (id /* , drag */) => {
    const { nodes } = this.props;
    return (
      <NodeContent
        // id={id}
        className={`${styles.nodeItemContent} ${
          nodes[id].noneauthed && styles.nodeItemDisabled
        }`}
      >
        <Tooltip title={nodes[id].noneauthed && "您没有该表访问权限"}>
          <div id={id} style={{ display: "inline-block", padding: "0 2px" }}>
            <img src={this.getNodeItemIcon(id)} alt="icon" />
          </div>
        </Tooltip>
        <Ellipsis tooltip lines={1} showCenter>
          {nodes[id].label || "undefined"}
        </Ellipsis>
      </NodeContent>
    );
  };

  render() {
    const {
      nodes,
      /* connections, loading, */ onSelect,
      graphRef,
    } = this.props;
    const { width, height, xOffset, yOffset } = this.props;

    const children = Object.keys(nodes).map((nodeName) => {
      const { style } = nodes[nodeName];

      return (
        <Node
          id={nodeName}
          key={nodeName}
          style={style}
          styleName="node"
          className={styles.nodeItem}
          // onSelect={onSelect}
        >
          {this.children}
        </Node>
      );
    });

    /**
     * 因为jsplumb-react结合了jsplumb的connector，两个实例无法绑定在同一个DOM上
     * 所以为了实现scale效果，弃用Graph组件自身封装的scale逻辑，直接在外层容器上根据scale值设置其样式
     */
    return (
      <div className={styles.canvas} ref={graphRef}>
        <div
          id="jsplumb_topological_graph"
          className={styles.canvasContent}
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <Spin spinning={false}>
            <Graph
              id="topologicalgraph"
              className={styles.topologicalgraph}
              width={width}
              height={height}
              xOffset={xOffset}
              yOffset={yOffset}
              // connections={connections}
              onSelect={onSelect}
              // onZoom={this.onZoom}
            >
              {children}
            </Graph>
          </Spin>
        </div>
      </div>
    );
  }
}

export default TopologicalGraph;
