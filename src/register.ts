import moduleAlias from "module-alias";
import path from "path";

// Register path aliases
moduleAlias.addAliases({
  "~": path.join(__dirname),
});

export default moduleAlias;
