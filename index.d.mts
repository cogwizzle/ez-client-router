export class RouterElement extends HTMLElement {
    /** @type {Route[]} */
    routes: Route[];
    indexRoutes(): void;
    _indexedRoutes: IndexedRoute[];
    get indexedRoutes(): IndexedRoute[];
    onNavigate(): void;
    currentPath: any;
    notFound(): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: any, oldValue: any, newValue: any): void;
    render(): Promise<void>;
}
export type Route = {
    path: string;
    title: string;
    go: ({ variables }: {
        variables: {
            name: string;
            value: string;
        }[];
    }) => Promise<string>;
};
export type IndexedRoute = {
    path: string;
    title: string;
    go: ({ variables }: {
        variables: {
            name: string;
            value: string;
        }[];
    }) => Promise<string>;
    variables: string[];
    regex: RegExp;
};
