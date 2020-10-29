import React from "react";
import _ from "lodash";
import { jsPlumb } from "jsplumb";

import TopologicalGraph from "./TopologicalGraph.js";

import styles from "./Graph.less";
import { basicId, listblood } from "../mock/listblood.js";

class RelationTable extends React.PureComponent {
  // $jsPlumb: InstanceType<typeof jsPlumbInstance>;

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
      nodes: {},
      connections: [],
      sourceData: [],
      targetData: [],
      checkedKeys: [],
      checkedNodes: [],
      currentId: "",
      // relatedTableList: [],

      // 画布高度动态调整(%)
      graphHeight: 100,
    };

    this.$jsPlumb = jsPlumb.getInstance({
      Endpoint: "Blank",
      EndpointStyle: {},
      PaintStyle: {
        stroke: "#1980ff",
        strokeWidth: 1,
      },
      HoverPaintStyle: {},
      Connector: ["Bezier", { cornerRadius: 1 }],
      ConnectionsDetachable: false,
      ConnectionOverlays: [],
    });
  }

  componentDidMount() {
    this.getInitialData();
  }

  // 在STEP-2中调用
  setContainer = (type, node) => {
    const { connections /*, nodes*/ } = this.state;

    this.$jsPlumb.setContainer(
      document.getElementById("jsplumb_topological_graph")
    );

    this.$jsPlumb.deleteEveryConnection();

    // 获取DOM实例后
    setTimeout(() => {
      connections.forEach((value) => {
        // 根据每条连线的两个节点排布位置，若水平高度相等，采用Straight，否则采用Bezier
        // const nodeLine = type === "linetype" ? node : nodes;
        // const sourceItem = nodeLine[value.source]?.style?.top; // calc(xx% - xxpx)
        // const targetItem = nodeLine[value.target]?.style?.top; // calc(xx% - xxpx)

        // const line =
        //   !!sourceItem &&
        //   !!targetItem &&
        //   sourceItem.slice(5, 7) === targetItem.slice(5, 7)
        //     ? "Straight"
        //     : "Bezier";
        // NOTE NOTE
        const line = "Bezier";

        if (value.source) {
          this.$jsPlumb.connect({
            source: value.source,
            target: value.target,
            anchor: ["Right", "Left"],
            connector: [`${line}`, { curviness: 120 }],
            cssClass: "hoverConnector",
            overlays: [
              ["Arrow", { width: 10, length: 10, location: 1, id: "myArrow" }],
            ],
          });
        }
      });
      this.$jsPlumb.setSuspendDrawing(false, true);
    }, 200);
  };

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
        this.getDynamicGraphHeight();

        this.setState({
          connections: this.transformNodeLine(this.state.relationData),
        });

        this.signAllNodeLayer(() => {
          this.setState(
            {
              nodes: this.transformSourceToNodeData(), // 这一步必须要在 signAllNodeLayer 执行后(代码也可放在signAllNodeLayer中执行)
            },
            () => {
              // console.log(this.state.nodes, "state-nodes...");
            }
          );
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
    console.log(sourceData, "sourceData...");
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

    console.log(newData, "newData...");
    return newData;
  };

  /**
   * NOTE 2. 将**初始数据**转化为可用的nodeData
   */
  transformSourceToNodeData = () => {
    const { relationData } = this.state;
    const node = {};
    relationData?.forEach((item) => {
      Object.assign(node, {
        [`${item.id}`]: {
          label: item.name,
          target: item.target,
          index: item.index,
          noneauthed: item.noneauthed,
          style: {
            left: this.calculateNodePosition(item, "left"),
            top: this.calculateNodePosition(item, "top"),
          },
        },
      });
    });

    this.setContainer("linetype", node);
    console.log(node, "node...");

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
    // console.log(connection, 'connection');
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

    // console.log(relationData, '初始化时的relationData...');

    this.signSideNodeLayer(middleNode, "pre", callback);
    // this.signSideNodeLayer(middleNode, "next", callback);
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

    // console.log(node, curIndex, "curIndex...");

    if (node[order]?.length) {
      node[order].forEach((perItem) => {
        const matchItem = relationData.find((item) => item.id === perItem);
        if (matchItem) {
          console.log(node, matchItem, curIndex, "将要改变index时...");

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

    // console.log(node, "生成计算index后的node数据...");

    this.setState(
      {
        // relationData,
        /** 此处过滤掉`旁系`节点（即不与中间节点父子主线相连的节点） */
        relationData: relationData.filter((item) => !!item.index),
      },
      () => callback?.()
    );
  };

  /**
   * 5. 根据node的index值，计算其left/top值
   * @description
   * left计算方式：((1/3)/2 + (2/3)*(当前节点的顺序(从1开始)/总结点数 - 1/当前空间(2*总节点数)等份))*100% - (节点宽度/2)px
   *    即横向节点准确均匀分布在1/6~5/6的中心区域
   * top计算方式：见 caculateNodeTopPosition
   */
  calculateNodePosition = (node, position) => {
    const { relationData = [] } = this.state;
    // console.log(relationData, "重新计算路径后得到的relationData...");

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

    // NOTE NOTE
    const allLength = preList.length + nextList.length;
    // 当前节点在横向层级中的层级顺序(从1开始)
    // const curNodeIndex = node.index?.includes("p")
    //   ? preList.length - preList.indexOf(node.index)
    //   : preList.length + nextList.indexOf(node.index) + 1;

    const curNodeIndex = node.index?.includes("p")
      ? preList.length - Number(node.index.slice(1))
      : preList.length + nextList.indexOf(node.index) + 1;

    switch (position) {
      case "left": {
        // calc(xx% - 30px)
        const percentage =
          1 / 6 + (2 / 3) * (curNodeIndex / allLength - 1 / (2 * allLength));
        return `calc(${Number(percentage).toFixed(2) * 100}% - 30px)`;
      }
      case "top": // calc(xx% - 20px)
        return this.caculateNodeTopPosition(node);
      default:
        return "0";
    }
  };

  /**
   * 5.1 计算节点top值，计算方式类同left
   * @description
   * top计算方式：
   *    ((1/4)/2 + (3/4)*(当前节点的顺序(从1开始)/每层纵向总结点数 - 1/当前空间(2*纵向总结点数)等份))*100% - (节点高度/2)px
   *    即纵向节点准确均匀分布在1/8~7/8的中心区域内
   */
  caculateNodeTopPosition = (curNode) => {
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

    // NOTE NOTE
    const verticalDecrementSize = 100 * Math.random().toFixed(1);
    return `calc(${
      Number(percentage).toFixed(2) * 100
    }% - ${verticalDecrementSize}px)`;
  };

  /**
   * NOTE 动态调整画布高度，根据拓扑图中节点树最多(m个)的列的高度来动态调整画布高度
   * 调整后的画布高度/原画布高度x：((1+(70m-0.75x)/0.75x)*100)%
   * 数据说明：70: 单个节点所占height; 0.75: 画布纵向内容部分占据的比例
   */
  getDynamicGraphHeight = () => {
    const { relationData } = this.state;
    // 每列节点个数([1, 4, 2])
    const columnCount = [];
    // 所有列(['p0', 'p1', 'p2'])
    const columnArr = Array.from(new Set(_.map(relationData, "index")));
    columnArr.forEach((item, idx) => {
      columnCount[idx] = relationData?.filter(
        (it) => it.index === item
      )?.length;
    });

    const columnMaxCount = Math.max(...columnCount);

    // 画布样式（高度），此处获取的是画布父级div
    // （因其高度一直不会变，且和画布初始化时的高度一致，所以可用来在每次编辑后作为画布初始高度值来做计算）
    const graphStyle = this.graphRef?.current.getBoundingClientRect();

    this.setState({
      graphHeight:
        70 * columnMaxCount > 0.75 * graphStyle.height
          ? (1 +
              (70 * columnMaxCount - parseInt(0.75 * graphStyle.height, 10)) /
                parseInt(0.75 * graphStyle.height, 10)) *
            100
          : 100,
    });
  };

  render() {
    window.onresize = this.setContainer;

    return (
      <div className={styles.relationTable}>
        <TopologicalGraph
          {...this.state}
          {...this.props}
          graphRef={this.graphRef}
        />
      </div>
    );
  }
}

export default RelationTable;
