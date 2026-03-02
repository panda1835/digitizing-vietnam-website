"use client";
import React, { Component } from "react";
import mirador from "mirador";

class Mirador extends Component<MiradorProps> {
  viewer: any = null;

  componentDidMount() {
    const { config, plugins } = this.props;
    this.viewer = mirador.viewer(config, plugins);
  }

  render() {
    const { config } = this.props;
    return <div id={config.id} />;
  }
}

export default Mirador;
