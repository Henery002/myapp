import G6 from "@antv/g6";

const primaryColor = "#1980ff";
const normalColor = "#fff";
const warnColor = "#FFC446";

export default function registerNode(graph, props) {
  console.log(graph, props, "graph...");

  const { isrecord = false } = props;

  G6.registerNode(
    "nodeName",
    {
      draw(cfg, group) {
        const { module, type } = cfg;
        const r = 2;

        const shape = group?.addShape("rect", {
          attrs: {
            x: 0,
            y: 0,
            width: 200,
            height: 30,
            stroke: "#e1e1e1",
            shadowOffsetX: 5,
            shadowOffsetY: 5,
            shadowColor: "#aaa",
            shadowBlur: 10,
            // stroke: color,
            // fill: '#fff',
            radius: r,
          },
          name: "border-box",
          draggable: true,
        });

        group?.addShape("rect", {
          attrs: {
            x: 0,
            y: 0,
            width: 200,
            height: 30,
            // stroke: color,
            fill: "#fff",
            radius: r,
          },
          name: "main-box",
          draggable: true,
        });
        // 假锚点
        if (module !== "input") {
          group?.addShape("circle", {
            attrs: {
              x: 0,
              y: 15,
              r: 12,
              fill: primaryColor,
              opacity: 0,
            },
            name: "anchor-shape-left-shadow",
          });
          group?.addShape("circle", {
            attrs: {
              x: 0,
              y: 15,
              r: 7,
              fill: normalColor,
              stroke: primaryColor,
              opacity: 0,
              cursor: "pointer",
            },
            name: "anchor-shape-left",
          });
        }

        if (module !== "output") {
          group?.addShape("circle", {
            attrs: {
              x: 200,
              y: 15,
              r: 7,
              stroke: primaryColor,
              fill: normalColor,
              opacity: 0,
              cursor: "pointer",
            },

            name: "anchor-shape-right",
          });
        }

        // left icon
        if (type) {
          group?.addShape("image", {
            attrs: {
              x: 8,
              y: 7,
              height: 16,
              width: 16,
              // img: ICON_MAP[type.includes("ket") ? "kettle" : type],
            },
            name: "node-icon",
            draggable: true,
          });
        }
        if (module) {
          group?.addShape("rect", {
            attrs: {
              x: 9,
              y: 6,
              width: 45,
              height: 18,
              radius: 8,
              // fill: DATAPROCESSELEMENTS.find((item) => item.id === module)
              //   ?.tagColor,
              fill: "#1980ff",
            },
            name: "node-icon",
            draggable: true,
          });
          group?.addShape("text", {
            attrs: {
              textBaseline: "top",
              y: 10,
              x: 18,
              lineHeight: 20,
              // text: DATAPROCESSELEMENTS.find((item) => item.id === module)
              //   ?.tagLabel,
              text: "test",
              fill: normalColor,
            },
            name: `node-icon-text`,
            draggable: true,
          });
        }
        // The content list
        // value text
        // https://g6.antv.vision/zh/examples/item/label
        // const newStr = fittingString(cfg?.name, module ? 125 : 150, 12);
        const newStr = "test123";
        // if (newStr === cfg?.name) {
        //   console.log('same');
        // } else {
        //   console.log('ellipsis');
        // }
        group?.addShape("text", {
          attrs: {
            textBaseline: "top",
            y: 10,
            x: module ? 58 : 30,
            lineHeight: 20,
            text: newStr,
            fill: "#333",
          },
          name: `index-title`,
          draggable: true,
        });

        return shape;
      },
      afterDraw(cfg, group) {
        // console.log(cfg, 'cfg');
        // @ts-ignore
        const { module: myModule } = cfg;
        // console.log(group, 'group');
        // const node = group?.cfg.item;
        // console.log(node, 'node');
        // const postData = linkMap.find((item) => item.id === myModule)?.post;
        const postData = undefined;
        const title = group?.find(
          (element) => element.get("name") === "index-title"
        );
        title?.on("mouseover", () => {
          if (title?.attr("text") !== cfg?.name) {
            const titlehover = group?.find(
              (element) => element.get("name") === "index-title-hover"
            );
            if (!titlehover) {
              group?.addShape("text", {
                attrs: {
                  // textBaseline: 'bottom',
                  y: -5,
                  x: 0,
                  lineHeight: 20,
                  text: cfg?.name,
                  fill: "#666",
                },
                name: `index-title-hover`,
                // draggable: false,
              });
            }
          }
        });
        title?.on("mousedown", () => {
          // removeTitleHover(group);
        });
        title?.on("mouseleave", () => {
          // removeTitleHover(group);
        });
        const anchors = group?.findAll((element) =>
          element.get("name").includes("anchor-shape")
        );
        anchors?.forEach((anchor) => {
          anchor.on("mousedown", () => {
            anchor.attr("fill", primaryColor);
            // graph.setItemState(node, 'mouseOver', false);
            const nodes = graph.getNodes();
            nodes.forEach((node) => {
              if (node?.getModel().id !== cfg?.id) {
                // 可连接的node状态设置
                const { module } = node?.getModel() || {};
                if (!myModule && !module) {
                  // 普通模块随意相连
                  graph.setItemState(node, "canLink", true);
                }
                if (module && postData?.includes(module)) {
                  graph.setItemState(node, "canLink", true);
                }
              }
            });
          });
        });

        graph.on("mouseup", () => {
          anchors?.forEach((anchor) => {
            anchor.attr("fill", "#fff");
            anchor.attr("opacity", 0);
          });
          const nodes = graph.getNodes();
          nodes.forEach((node) => {
            graph.setItemState(node, "canLink", false);
          });
        });
      },
      update(cfg, node) {},
      afterUpdate(cfg, node) {},
      setState(name, value, item) {
        // console.log(name, value, 'setState');
        const group = item?.getContainer();
        const borderBox = group?.find(
          (element) => element.get("name") === "border-box"
        );
        // const anchors = group?.findAll((element) =>
        //   element.get('name').includes('anchor-shape'),
        // );
        const anchorLeft = group?.find(
          (element) => element.get("name") === "anchor-shape-left"
        );
        const anchorLeftShadow = group?.find(
          (element) => element.get("name") === "anchor-shape-left-shadow"
        );
        const anchorRight = group?.find(
          (element) => element.get("name") === "anchor-shape-right"
        );
        const statusIcon = group?.find(
          (element) => element.get("name") === "status-icon"
        );
        const statusSVGs = {};

        switch (name) {
          case "runStatus":
            // console.log(value, 'runStatus');
            if (typeof value === "string" && statusSVGs[value]) {
              if (statusIcon) {
                group?.removeChild(statusIcon);
              }
              group?.addShape("image", {
                attrs: {
                  x: 177,
                  y: 7,
                  height: 16,
                  width: 16,
                  img: statusSVGs[value] ?? "",
                },
                name: "status-icon",
                draggable: true,
              });
            }
            break;
          case "selected":
            if (isrecord) {
              const {
                _cfg: {
                  model: { type },
                },
              } = item;
              if (type !== "batch") {
                borderBox?.attr({
                  // stroke: value ? primaryColor : '#e1e1e1',
                  stroke: primaryColor,
                });
              }
            }
            break;
          case "cancelClick":
            borderBox?.attr({
              stroke: "#e1e1e1",
            });
            break;
          case "edit":
            borderBox?.attr({
              stroke: value ? warnColor : "#e1e1e1",
            });
            break;
          case "canLink":
            if (value) {
              anchorLeft?.attr("opacity", 1);
              anchorLeftShadow?.attr("fill", primaryColor);
              anchorLeftShadow?.attr("opacity", 0.3);
            } else {
              anchorLeftShadow?.attr("opacity", 0);
            }
            break;
          case "mouseOver":
            // link中途不触发MouseOver
            // console.log(anchorLeft, 'anchorLeft');
            if (!anchorLeft || anchorLeft?.attr("opacity") === 0) {
              anchorRight?.attr(
                "opacity",
                value || anchorRight.attr("fill") === primaryColor ? 1 : 0
              );
            }
            break;
          default:
        }
      },
      getAnchorPoints(cfg) {},
    },
    "extendedNodeName"
  );
}
