import React from "react";
import _ from "lodash";
import { jsPlumb } from "jsplumb";

import TopologicalGraph from "./TopologicalGraph.js";

import styles from "./Graph.less";
import { listblood, listdir } from "../mock/listblood.js";

const basicId = "AXUgjQvdZGmXuhpWo7iT";

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
    const { connections, nodes } = this.state;

    this.$jsPlumb.setContainer(
      document.getElementById("jsplumb_topological_graph")
    );

    this.$jsPlumb.deleteEveryConnection();

    // 获取DOM实例后
    setTimeout(() => {
      connections.forEach((value) => {
        // 根据每条连线的两个节点排布位置，若水平高度相等，采用Straight，否则采用Bezier
        const nodeLine = type === "linetype" ? node : nodes;
        const sourceItem = nodeLine[value.source]?.style?.top; // calc(xx% - xxpx)
        const targetItem = nodeLine[value.target]?.style?.top; // calc(xx% - xxpx)

        const line =
          !!sourceItem &&
          !!targetItem &&
          sourceItem.slice(5, 7) === targetItem.slice(5, 7)
            ? "Straight"
            : "Bezier";

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

        // 生成relationData数据后，请求编辑弹窗数据(formateTreeData中需要用到relationData)
        const cataList = listdir;

        this.setState({
          sourceData: this.formateTreeData(cataList), // 弹窗中的树
        });

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
    // console.log(node, 'node...');

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
    this.signSideNodeLayer(middleNode, "next", callback);
  };

  /**
   * 4.1 拓扑图
   * 根据中间节点，计算其他节点相对于该节点的左右位置'p{index}、n{index}'，即为节点生成 index 属性值
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
          Object.assign(matchItem, {
            index: `${order.slice(0, 1)}${curIndex + 1}`,
          });
          this.signSideNodeLayer(
            relationData.find((item) => item.id === perItem),
            order
          );
        }
      });
    }
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
  calculateNodePosition = (node, position: string): string => {
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

    // NOTE
    const allLength = preList.length + nextList.length;
    // 当前节点在横向层级中的层级顺序(从1开始)
    const curNodeIndex = node.index?.includes("p")
      ? /* ? preList.indexOf(node.index) + 1 */
        // allLength - preList.indexOf(node.index)
        preList.length - preList.indexOf(node.index)
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
  caculateNodeTopPosition = (curNode): string => {
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
    return `calc(${Number(percentage).toFixed(2) * 100}% - ${
      curNode.index === "p0" ? 28 : 20
    }px)`; // 大图标高56px，小图标高40px
  };

  /**
   * 获取待选表所有叶节点（非下游节点、非当前表，即可被选择的节点），全选时使用
   * NOTE 待选表树的每个节点（表）都有`bloodtables`属性（从接口直接获取），标记该节点`自身的血缘数据`
   * 但/listblood接口获取到的relationData中的每个节点带有的属性是`bloodfatherids`，没有bloodtables。此处需要尤其注意
   */
  getTreeNodeLeaf = (nodeData, leafNodes) => {
    const {
      assetCenterBasic: {
        titleInfo: { id: basicId },
      },
    } = this.props;

    nodeData?.forEach((nodeItem) => {
      if (nodeItem?.name) {
        this.getTreeNodeLeaf(nodeItem.children, leafNodes);
      } else if (
        // 表（叶）节点、非当前节点且非下游的节点，被收集
        !this.checkChildRelatedTable(nodeItem) &&
        nodeItem.id !== basicId &&
        // (!nodeItem.children || !nodeItem.children.length)
        nodeItem?.tbname
      ) {
        leafNodes.push({
          key: nodeItem.id,
          title: nodeItem?.name ?? nodeItem?.tbname,
          noneauthed: nodeItem.noneauthed ?? false,
          bloodtables: nodeItem.bloodtables,
        });
      }
    });

    // console.log(nodeData, leafNodes, 'leafNodes'); // leafNodes已正确，不会收集children: []的父节点
    return leafNodes;
  };

  // 获取待选表所有节点key，全选时使用(包括“全选”节点)
  getTreeNodeAll = (nodeData, allNodes) => {
    nodeData?.forEach((nodeItem) => {
      if (nodeItem?.children?.length) {
        allNodes.push(nodeItem.id);
        this.getTreeNodeAll(nodeItem.children, allNodes);
      } else if (!nodeItem?.children || !nodeItem.children.length) {
        allNodes.push(nodeItem.id);
      }
    });

    return Array.from(new Set(allNodes));
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

  /*
   * 处理backupData中异常的数据格式，使之符合接口参数规范
   * !!NOTE
   * backupdata由targetData处理得到，backupDataItem有的带bloodtables属性，
   * 有的带bloodfatherids属性，保存时需甄别（其特殊性由接口返回值导致）
   * #0824解决:
   *  <1>. backupdata中除了自带当前节点（及其bloodfatherids），其他为targetData中的带bloodtables的节点
   *  <2>. bloodtables中的值即为保存时需要一并传入的关联节点的血缘链
   *  <3>. bloodtables中可能存在当前节点（但这个当前节点所带的bloodfatherids是旧值），需要将这个节点过滤掉，用新值替换（新值即为<1>中自带的这个节点）
   *  <4>. 其中<3>也是导致保存时不成功（仍为旧值）的主要原因
   */
  getBloodtablesPayload = (bloodDatas) => {
    let bloodTablesAll = [];

    // 当前中心节点（用于删除旧血缘链上该节点的旧值）
    const curNode = bloodDatas.find((it) => it.index === "p0");

    bloodDatas?.forEach((item) => {
      if (item.hasOwnProperty("bloodfatherids")) {
        bloodTablesAll.push({
          id: item.id,
          tbname: item.name,
          bloodfatherids: item.bloodfatherids,
        });
      } else if (item.hasOwnProperty("bloodtables")) {
        if (item.bloodtables?.find((it) => it.tbname === curNode?.name)) {
          item.bloodtables = item.bloodtables.filter(
            (it) => it.tbname !== curNode?.name
          );
        }

        bloodTablesAll = [...bloodTablesAll, ...(item.bloodtables ?? [])];
      }
    });

    // 因为不同targetData中节点的bloodtables值（即血缘链上）可能存在同一个节点多次，此处需要做去重
    return _.uniqWith(bloodTablesAll, _.isEqual);
  };

  /**
   * 检测当前节点是否是中心节点的下游节点
   * @return {boolean}
   */
  checkChildRelatedTable = (nodeData) => {
    const { relationData } = this.state;

    const childrenNodes = relationData?.filter((item) =>
      item.index?.includes("n")
    );
    return !!childrenNodes?.find((item) => item.id === nodeData.id);
  };

  /**
   * 生成格式化后的树数据(弹窗中)
   */
  formateTreeData = (sourceData) => {
    // 收集根节点数据newData
    const newData = sourceData.filter((item) => !item.parentid);

    return this.recurseTreeNode(sourceData, newData);
  };

  // 根据根节点newData递归遍历并收集节点层级
  recurseTreeNode = (sourceData, newData) => {
    newData.forEach((newItem) => {
      sourceData.forEach((sourceItem) => {
        // 查找父节点的子节点
        if (sourceItem.parentid === newItem.id) {
          if (
            newItem.children &&
            !newItem.children.find((item) => item.id === sourceItem.id)
          ) {
            newItem.children.push(sourceItem);
          } else if (!newItem.children) {
            newItem.children = [sourceItem];
          }
          // @ts-ignore
          this.recurseTreeNode(sourceData, newItem.children);
        }
      });
    });

    // return this.recurseTableNode(newData);
    return newData;
  };

  render() {
    window.onresize = this.setContainer;

    return (
      <div className={styles.relationTable}>
        <TopologicalGraph
          {...this.state}
          {...this.props}
          onSelect={this.onSelect}
          changeState={this.changeState}
          editRelatedTable={this.editRelatedTable}
          signAllNodeLayer={this.signAllNodeLayer}
          graphRef={this.graphRef}
        />
      </div>
    );
  }
}

export default RelationTable;
