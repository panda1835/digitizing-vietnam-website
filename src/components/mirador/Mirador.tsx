"use client";
import React, { Component } from "react";
import mirador from "mirador";

let _miradorStore: any = null;

/** Access the Mirador Redux store (available after mount). */
export function getMiradorStore() {
  return _miradorStore;
}

class Mirador extends Component<MiradorProps> {
  componentDidMount() {
    const { config, plugins } = this.props;
    const instance = mirador.viewer(config, plugins);
    _miradorStore = instance.store;
  }
  componentWillUnmount() {
    _miradorStore = null;
  }
  render() {
    const { config } = this.props;
    return <div id={config.id} />;
  }
}

export default Mirador;
