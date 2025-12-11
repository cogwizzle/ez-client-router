/**
 * @typedef {object} Route
 * @property {string} path
 * @property {string} title
 * @property {({ variables }: { variables: {name: string, value: string }[]}) => Promise<string>} go
 */

/**
 * @typedef {object} IndexedRoute
 * @property {string} path
 * @property {string} title
 * @property {({ variables }: { variables: { name: string, value: string }[]}) => Promise<string>} go
 * @property {string[]} variables
 * @property {RegExp} regex
 */

/**
 * Generates the variables and regular expression for a given path.
 *
 * @param {string} path The path to generate the variables and regular expression for.
 * @returns {{variableNames: string[], regex: RegExp}}
 */
const generateVariablesAndRegularExpression = (path) => {
  const regex = /{[a-zA-Z]*}/g;
  // Get variable names.
  const variableNames = [...path.matchAll(regex)].map((match) => {
    return match[0].replace(/[{|}]/g, "");
  });
  // Get matcher.
  const regularExpression = new RegExp(
    path.replaceAll(regex, `([a-zA-Z1-9\\-]*)`).replaceAll(/\//g, "/"),
  );
  return {
    variableNames,
    regex: regularExpression,
  };
};

/**
 * Gets the variables from a given path.
 *
 * @param {string} path The path to get the variables from.
 * @param {{ variables: string[], regex: RegExp}} route The route to get the variables from.
 * @returns {{name: string, value: string}[]}
 */
const getVariables = (path, { variables, regex }) => {
  const variableValues = path.match(regex) || [];
  variableValues.shift();
  return variableValues.map((value, index) => ({
    name: variables[index],
    value,
  }));
};

/**
 * Creates a route index.
 *
 * @param {Route} route The route to create the index for.
 * @returns {IndexedRoute}
 */
const createRouteIndex = (route) => {
  const { variableNames, regex } = generateVariablesAndRegularExpression(
    route.path,
  );
  return {
    ...route,
    variables: variableNames,
    regex,
  };
};

/**
 * Creates the route indexes.
 *
 * @param {Route[]} routes The routes to create the indexes for.
 * @returns {IndexedRoute[]}
 */
const createRouteIndexes = (routes) => routes.map(createRouteIndex);

export class RouterElement extends HTMLElement {
  /** @type {Route[]} */
  routes = [];
  constructor() {
    super();
    if (this.constructor == RouterElement) {
      throw new Error("Abstract classes can't be instantiated.");
    }
  }

  indexRoutes() {
    if (!this.routes)
      throw new Error(
        "Router element needs routes defined in the connected callback.",
      );
    this._indexedRoutes = createRouteIndexes(
      this.routes.sort((a, b) => {
        return a.path.length < b.path.length ? 1 : -1;
      }),
    );
  }

  get indexedRoutes() {
    return this._indexedRoutes;
  }

  onNavigate() {
    const path = window.location.pathname;

    if (path !== this.currentPath) {
      this.currentPath = path;
      this.render();
    }
  }

  notFound() {
    this.innerHTML = `
      <h1>Unable to find page</h1>
      <div>
        I'm sorry the page you're looking for was unable to be found.
      </div>
    `;
  }

  connectedCallback() {
    this.indexRoutes();
    this.currentPath = window.location.pathname;
    this.render();
    window.addEventListener("navigate", this.onNavigate.bind(this));
  }

  disconnectedCallback() {
    window.removeEventListener("navigate", this.onNavigate.bind(this));
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.indexRoutes();
      this.render();
    }
  }

  async render() {
    const route = this.indexedRoutes?.find((indexedRoute) =>
      indexedRoute.regex.test(this.currentPath),
    );
    if (
      !route ||
      (route.path === "" && this.currentPath !== "" && this.currentPath !== "/")
    ) {
      this.notFound();
      return;
    }
    const variables = getVariables(this.currentPath, route);
    const template = document.createElement("template");
    try {
      template.innerHTML = await route.go({
        variables,
      });
      this.innerHTML = "";
      this.appendChild(template.content.cloneNode(true));
    } catch (e) {
      throw new Error(e);
    }
  }
}
