"use client";
import React, { Component } from "react";
import mirador from "mirador";

class Mirador extends Component<MiradorProps> {
  componentDidMount() {
    const { config, plugins } = this.props;
    mirador.viewer(config, plugins);
  }
  render() {
    const { config } = this.props;
    return <div id={config.id} />;
  }
}

export default Mirador;
