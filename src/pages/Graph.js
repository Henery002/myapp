import React from "react";

import G6graph from "./G6graph";

import styles from "./Graph.less";
import { basicId, listblood } from "../mock/listblood.js";

class RelationTable extends React.PureComponent {
  graphRef = React.createRef();

  constructor(props) {
    super(props);

    this.state = {
      visible: false,
      width: "100%",
      height: "100%",
      scale: 1.0,
      maxScale: 1.3,
      minScale: 0.7,
      xOffset: 0.0,
      yOffset: 0.0,
      relationData: [],
      nodes: [],
      connections: [],
      sourceData: [],
      targetData: [],
      checkedKeys: [],
      checkedNodes: [],
      currentId: "",
      // relatedTableList: [],

      // 画布高度动态调整(%)
      // graphHeight: 100,
    };
  }

  componentDidMount() {
    this.getInitialData();
  }

  /**
   * 请求接口数据
   */
  getInitialData = () => {
    const relatedTables = listblood;
    this.setState(
      {
        relationData: this.transformInitData(relatedTables),
        // 页面加载完，默认设置currentId为当前表
        currentId: basicId,
      },
      () => {
        this.setState({
          connections: this.transformNodeLine(this.state.relationData),
        });

        this.signAllNodeLayer(() => {
          this.setState({
            nodes: this.transformSourceToNodeData(), // 这一步必须要在 signAllNodeLayer 执行后(代码也可放在signAllNodeLayer中执行)
          });
        });
      }
    );
  };

  /**
   * NOTE 1. 将`接口源数据`转换为**初始可用的节点数据结构**
   * @param sourceData - 接口原生数据
   * @returns newData - 格式化后的数据结构
   */
  transformInitData = (sourceData) => {
    const newData = sourceData?.map(
      ({ id, tbname, bloodfatherids, noneauthed = false }) => ({
        id,
        name: tbname,
        // 如果该节点是当前节点，target属性为true
        target: !!(id === basicId),
        // 如果该节点是当前节点，则标记为p0
        index: id === basicId ? "p0" : "",
        pre: bloodfatherids,
        next: [],
        noneauthed,
        bloodfatherids,
      })
    );
    newData.forEach((item) => {
      if (item.pre?.length) {
        item.pre.forEach((preItem) => {
          const preData = newData.find((it) => it.id === preItem);
          if (preData) preData.next?.push(item.id);
        });
      }
    });

    return newData;
  };

  /**
   * NOTE 2. 将**初始数据**转化为可用的nodeData
   */
  transformSourceToNodeData = () => {
    const { relationData } = this.state;
    const node = relationData?.map((item) => {
      return {
        id: item.id,
        label: item.name,
        target: item.target,
        index: item.index,
        noneauthed: item.noneauthed,
        style: {
          left: this.calculateNodePosition(item, "left"),
          top: this.calculateNodePosition(item, "top"),
        },
      };
    });

    return node;
  };

  /**
   * 3. 将**初始数据**生成连线数据connectionData
   */
  transformNodeLine = (sourceData) => {
    const connection = [];
    sourceData.forEach((item) =>
      item.pre?.length
        ? item.pre.forEach((preItem) => {
            connection.push({
              id: `${sourceData.find((it) => it.id === preItem)?.name}-${
                item.name
              }-${Math.random().toFixed(6)}`,
              source: sourceData.find((it) => it.id === preItem)?.id || "",
              target: item.id || "",
            });
          })
        : null
    );
    return connection;
  };

  /**
   * 4. 根据中间节点，**计算**其他节点相对于该**节点的左右位置**
   * @param {string} id - 当前节点id
   * @param {Function} callback
   */
  signAllNodeLayer = (callback) => {
    const { relationData } = this.state;
    const middleNode = relationData?.find((item) => item.target);

    this.signSideNodeLayer(middleNode, "pre", callback);
    this.signSideNodeLayer(middleNode, "next", callback);
  };

  /**
   * 4.1 拓扑图
   * TEMP 根据中间节点，计算其他节点相对于该节点的左右位置'p{index}、n{index}'，即为节点生成 index 属性值
   * @param {SourceDataItem} node - 当前节点
   * @param {string} order - 左右位置
   */
  signSideNodeLayer = (node = {}, order, callback) => {
    const { relationData = [] } = this.state;
    const curIndex = parseInt(node.index?.slice(1), 10);

    if (node[order]?.length) {
      node[order].forEach((perItem) => {
        const matchItem = relationData.find((item) => item.id === perItem);
        if (matchItem) {
          /**
           * NOTE NOTE
           * 如果matchItem的index的序号已经大于当前curIndex，
           * 说明已经出现更长的路径（即当前节点的这个路径），则不能再修改其index，即不能再将其路径改短
           */
          if (
            !matchItem.index ||
            Number(matchItem.index.slice(1)) <= curIndex
          ) {
            Object.assign(matchItem, {
              index: `${order.slice(0, 1)}${curIndex + 1}`,
            });
          }

          this.signSideNodeLayer(matchItem, order);
        }
      });
    }

    this.setState(
      {
        /** 此处过滤掉`旁系`节点（即不与中间节点父子主线相连的节点） */
        relationData: relationData.filter((item) => !!item.index),
      },
      () => {
        // this.getDynamicGraphHeight();

        callback?.();
      }
    );
  };

  /**
   * 5. 根据node的index值，计算其left/top值
   */
  calculateNodePosition = (node, position) => {
    switch (position) {
      case "left":
        return this.caculateLeftPosition(node);
      case "top":
        return this.caculateTopPosition(node);
      default:
        return "0";
    }
  };

  /**
   * 5.1
   * @description
   * left计算方式：((1/3)/2 + (2/3)*(当前节点的顺序(从1开始)/总结点数 - 1/当前空间(2*总节点数)等份))*100% - (节点宽度/2)px
   *    即横向节点准确均匀分布在1/6~5/6的中心区域
   */
  caculateLeftPosition = (node) => {
    const { relationData = [] } = this.state;

    const preList = Array.from(
      new Set(
        relationData
          .map((item) => item.index?.includes("p") && item.index)
          .filter((it) => it)
      )
    ); // => ['p0', 'p1', 'p2', ...]，表示中间节点左侧父节点所拥有的层数数组
    const nextList = Array.from(
      new Set(
        relationData
          .map((item) => item.index?.includes("n") && item.index)
          .filter((it) => it)
      )
    ); // => ['n1, 'n2', ...]

    const allLength = preList.length + nextList.length;

    // 当前节点在横向层级中的层级顺序(从1开始)
    const curNodeIndex = node.index?.includes("p")
      ? preList.length - Number(node.index.slice(1))
      : preList.length + nextList.indexOf(node.index) + 1;

    const percentage =
      1 / 6 + (2 / 3) * (curNodeIndex / allLength - 1 / (2 * allLength));

    return `calc(${Number(percentage).toFixed(2) * 100}% - 30px)`;
  };

  /**
   * 5.2 计算节点top值，计算方式类同left
   * @description
   * top计算方式：
   *    ((1/4)/2 + (3/4)*(当前节点的顺序(从1开始)/每层纵向总结点数 - 1/当前空间(2*纵向总结点数)等份))*100% - (节点高度/2)px
   *    即纵向节点准确均匀分布在1/8~7/8的中心区域内
   */
  caculateTopPosition = (curNode) => {
    const { relationData } = this.state;
    // 每一层级纵向节点数组
    const verticalLayerNodeList = relationData?.filter(
      (item) => item.index === curNode.index
    );
    // 当前节点在纵向节点数组中的下标
    const curIndex = verticalLayerNodeList?.findIndex(
      (item) => item.id === curNode.id
    );
    const percentage =
      1 / 8 +
      (3 / 4) *
        ((curIndex + 1) / verticalLayerNodeList.length -
          1 / (2 * verticalLayerNodeList.length));

    // return `calc(${Number(percentage).toFixed(2) * 100}% - ${
    //   curNode.index === "p0" ? 28 : 20
    // }px)`; // 大图标高56px，小图标高40px

    const verticalDecrementSize = (100 * Math.random()).toFixed(2);

    return `calc(${
      Number(percentage).toFixed(2) * 100
      // }% - ${verticalDecrementSize}px)`;
    }% - ${curNode.index === "p0" ? 28 : 20}px)`;
  };

  render() {
    const { nodes, connections } = this.state;
    return (
      <div className={styles.relationTable}>
        <G6graph {...this.state} dataSource={{ nodes, edges: connections }} />
      </div>
    );
  }
}

export default RelationTable;
