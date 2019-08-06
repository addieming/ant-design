import React, { cloneElement } from 'react';
import * as PropTypes from 'prop-types';
import classNames from 'classnames';
import BreadcrumbItem from './BreadcrumbItem';
import BreadcrumbSeparator from './BreadcrumbSeparator';
import Menu from '../menu';
import { ConfigConsumer, ConfigConsumerProps } from '../config-provider';
import warning from '../_util/warning';
import { Omit } from '../_util/type';

export interface Route {
  path: string;
  breadcrumbName: string;
  children?: Omit<Route, 'children'>[];
}

export interface BreadcrumbProps {
  prefixCls?: string;
  routes?: Route[];
  params?: any;
  separator?: React.ReactNode;
  itemRender?: (
    route: Route,
    params: any,
    routes: Array<Route>,
    paths: Array<string>,
  ) => React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

function getBreadcrumbName(route: Route, params: any) {
  if (!route.breadcrumbName) {
    return null;
  }
  const paramsKeys = Object.keys(params).join('|');
  const name = route.breadcrumbName.replace(
    new RegExp(`:(${paramsKeys})`, 'g'),
    (replacement, key) => params[key] || replacement,
  );
  return name;
}

function defaultItemRender(route: Route, params: any, routes: Route[], paths: string[]) {
  const isLastItem = routes.indexOf(route) === routes.length - 1;
  const name = getBreadcrumbName(route, params);
  return isLastItem ? <span>{name}</span> : <a href={`#/${paths.join('/')}`}>{name}</a>;
}

export default class Breadcrumb extends React.Component<BreadcrumbProps, any> {
  static Item: typeof BreadcrumbItem;

  static Separator: typeof BreadcrumbSeparator;

  static defaultProps = {
    separator: '/',
  };

  static propTypes = {
    prefixCls: PropTypes.string,
    separator: PropTypes.node,
    routes: PropTypes.array,
  };

  componentDidMount() {
    const { props } = this;
    warning(
      !('linkRender' in props || 'nameRender' in props),
      'Breadcrumb',
      '`linkRender` and `nameRender` are removed, please use `itemRender` instead, ' +
        'see: https://u.ant.design/item-render.',
    );
  }

  getPath = (path: string, params: any) => {
    path = (path || '').replace(/^\//, '');
    Object.keys(params).forEach(key => {
      path = path.replace(`:${key}`, params[key]);
    });
    return path;
  };

  addChildPath = (paths: string[], childPath: string = '', params: any) => {
    const originalPaths = [...paths];
    const path = this.getPath(childPath, params);
    if (path) {
      originalPaths.push(path);
    }
    return originalPaths;
  };

  genForRoutes = ({
    routes = [],
    params = {},
    separator,
    itemRender = defaultItemRender,
  }: BreadcrumbProps) => {
    const paths: string[] = [];
    return routes.map(route => {
      const path = this.getPath(route.path, params);

      if (path) {
        paths.push(path);
      }
      // generated overlay by route.children
      let overlay = null;
      if (route.children && route.children.length) {
        overlay = (
          <Menu>
            {route.children.map(child => (
              <Menu.Item key={child.breadcrumbName || child.path}>
                {itemRender(child, params, routes, this.addChildPath(paths, child.path, params))}
              </Menu.Item>
            ))}
          </Menu>
        );
      }

      return (
        <BreadcrumbItem overlay={overlay} separator={separator} key={route.breadcrumbName || path}>
          {itemRender(route, params, routes, paths)}
        </BreadcrumbItem>
      );
    });
  };

  renderBreadcrumb = ({ getPrefixCls }: ConfigConsumerProps) => {
    let crumbs;
    const {
      prefixCls: customizePrefixCls,
      separator,
      style,
      className,
      routes,
      children,
    } = this.props;
    const prefixCls = getPrefixCls('breadcrumb', customizePrefixCls);
    if (routes && routes.length > 0) {
      // generated by route
      crumbs = this.genForRoutes(this.props);
    } else if (children) {
      crumbs = React.Children.map(children, (element: any, index) => {
        if (!element) {
          return element;
        }

        warning(
          element.type &&
            (element.type.__ANT_BREADCRUMB_ITEM || element.type.__ANT_BREADCRUMB_SEPARATOR),
          'Breadcrumb',
          "Only accepts Breadcrumb.Item and Breadcrumb.Separator as it's children",
        );

        return cloneElement(element, {
          separator,
          key: index,
        });
      });
    }
    return (
      <div className={classNames(className, prefixCls)} style={style}>
        {crumbs}
      </div>
    );
  };

  render() {
    return <ConfigConsumer>{this.renderBreadcrumb}</ConfigConsumer>;
  }
}
