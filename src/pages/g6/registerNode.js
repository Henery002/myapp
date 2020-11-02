import G6 from "@antv/g6";

export default function registerNode(graph, props) {
  G6.registerNode(
    "custom-node",
    {
      // options: {
      //   style: {},
      //   stateStyles: {
      //     hover: { cursor: "pointer", transform: scale(1.06) },
      //   },
      // },
      drawShape: (cfg, group) => {
        console.log(cfg, group, "registerNode-draw...");
      },

      update(cfg, node) {},

      setState: (name, value, item) => {
        console.log(name, value, item, "registerNode-setState...");
      },
    }
    // "single-node"
  );
}
