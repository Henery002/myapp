import React from "react";
import _ from "lodash";

import G6graph from "./Graph";

class RelationGraph extends React.PureComponent {
  constructor(props) {
    super(props);

    this.divRef = React.createRef();

    this.state = {
      width: "100%",
      height: "100%",
      relationData: [],
      nodes: [],
      connections: [],
      sourceData: [],
      targetData: [],
      currentId: "",

      graphWidth: 400,
      graphHeight: 400,
    };
  }

  componentDidMount() {
    this.getInitialData();
  }

  getInitialData = () => {
    const { listBlood: relatedTables, basicId } = this.props?.initData;

    this.setState(
      {
        relationData: this.transformInitData(relatedTables),
        currentId: basicId,
      },
      () => {
        this.signAllNodeLayer(() => {
          this.setState(
            {
              nodes: this.transformSourceToNodeData(),
            },

            () => {
              this.setState({
                connections: this.transformNodeLine(this.state.relationData),
              });
            }
          );
        });
      }
    );
  };

  transformInitData = (sourceData) => {
    const { basicId } = this.props?.initData;
    const newData = sourceData?.map(({ id, tbname, bloodfatherids }) => ({
      id,
      name: tbname,
      target: !!(id === basicId),
      index: id === basicId ? "p0" : "",
      pre: bloodfatherids,
      next: [],
      bloodfatherids,
    }));

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

  transformSourceToNodeData = () => {
    const { relationData } = this.state;
    const node = relationData?.map((item) => {
      return {
        id: item.id,
        label: item.name,
        target: item.target,
        index: item.index,
        style: {
          left: this.calculateNodePosition(item, "left"),
          top: this.calculateNodePosition(item, "top"),
        },
      };
    });

    return node;
  };

  transformNodeLine = (sourceData) => {
    const connection = [];
    sourceData.forEach((item) =>
      item.pre?.length
        ? item.pre.forEach((preItem) => {
            const source = sourceData?.find((it) => it?.id === preItem);
            const isExist = connection.filter(
              (it) => it.source === source?.id && it.target === item.id
            );

            if (source && !isExist?.length) {
              if (
                source?.index?.includes("p") &&
                source?.index !== "p0" &&
                item.index?.includes("n")
              ) {
                return;
              }

              connection.push({
                id: `${source.name}-${item.name}`,
                source: source?.id || "",
                target: item.id || "",
              });
            }
          })
        : null
    );
    return connection;
  };

  signAllNodeLayer = (callback) => {
    const { relationData } = this.state;
    const middleNode = relationData?.find((item) => item.target);
    console.log(relationData, "relationData...");

    this.signSideNodeLayer(middleNode, "pre", callback);
    this.signSideNodeLayer(middleNode, "next", callback);
  };

  signSideNodeLayer = (node = {}, order, callback) => {
    const { relationData = [] } = this.state;
    const curIndex = Number(node.index?.slice(1));

    if (node[order]?.length) {
      node[order].forEach((perItem) => {
        const matchItem = relationData.find((item) => item.id === perItem);
        if (matchItem) {
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
        relationData: relationData.filter((item) => !!item.index),
      },
      () => {
        this.getDynamicGraphStyle();

        callback?.();
      }
    );
  };

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

  caculateLeftPosition = (node) => {
    const { relationData = [] } = this.state;

    const preList = Array.from(
      new Set(
        relationData
          .map((item) => item.index?.includes("p") && item.index)
          .filter((it) => it)
      )
    );
    const nextList = Array.from(
      new Set(
        relationData
          .map((item) => item.index?.includes("n") && item.index)
          .filter((it) => it)
      )
    );

    const allLength = preList.length + nextList.length;

    const curNodeIndex = node.index?.includes("p")
      ? preList.length - Number(node.index.slice(1))
      : preList.length + Number(node.index.slice(1));

    const percentage =
      1 / 6 + (2 / 3) * (curNodeIndex / allLength - 1 / (2 * allLength));

    return `calc(${Number(percentage.toFixed(2)) * 100}% - 30px)`;
  };

  caculateTopPosition = (curNode) => {
    const { relationData } = this.state;
    const verticalLayerNodeList = relationData?.filter(
      (item) => item.index === curNode.index
    );
    const curIndex = verticalLayerNodeList?.findIndex(
      (item) => item.id === curNode.id
    );
    const percentage =
      1 / 8 +
      (3 / 4) *
        ((curIndex + 1) / verticalLayerNodeList.length -
          1 / (2 * verticalLayerNodeList.length));

    return `calc(${Number(percentage.toFixed(2)) * 100}% - ${
      curNode.index === "p0" ? 28 : 20
    }px)`;
  };

  getDynamicGraphStyle = () => {
    const { relationData } = this.state;
    const columnCount = [];
    const columnArr = Array.from(new Set(_.map(relationData, "index")));
    columnArr.forEach((item, idx) => {
      columnCount[idx] = relationData?.filter(
        (it) => it.index === item
      )?.length;
    });

    const columnMaxCount = Math.max(...columnCount);
    const rowMaxCount = columnArr?.length;

    const { width, height } = this.divRef?.current.getBoundingClientRect();
    console.log(
      this.divRef.current.getBoundingClientRect(),
      rowMaxCount,
      columnMaxCount,
      Number(
        (1 + (85 * columnMaxCount - Number(height)) / Number(height)).toFixed(
          2
        ) * 100
      ),
      "divRef..."
    );

    this.setState({
      graphWidth:
        width && 100 * rowMaxCount > width
          ? Number(
              (1 + (100 * rowMaxCount - Number(width)) / Number(width)).toFixed(
                2
              ) * width
            )
          : width,
      graphHeight:
        height && 85 * columnMaxCount > height
          ? Number(
              (
                1 +
                (85 * columnMaxCount - Number(height)) / Number(height)
              ).toFixed(2) * height
            )
          : height,
    });
  };

  handleProgressChange = () => {
    this.setState({ loading: !this.state.loading });
  };

  render() {
    const { graphWidth, graphHeight } = this.state;
    return (
      <div
        ref={this.divRef}
        style={{
          width: "100%",
          height: "100%",
          minWidth: graphWidth,
          minHeight: graphHeight,
          overflow: "hidden",
        }}
      >
        <G6graph {...this.state} />
      </div>
    );
  }
}

export default RelationGraph;
