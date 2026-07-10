import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Header />
      <div className="layout-body">
        <Sidebar />
        <main className="layout-main">{children}</main>
      </div>
      <Toolbar />
    </div>
  );
}
