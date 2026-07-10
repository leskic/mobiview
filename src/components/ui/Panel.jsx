import "./Panel.css";

function Panel({ title, children, footer }) {
  return (
    <section className="mv-panel">
      {title && (
        <header className="mv-panel-header">
          <h3>{title}</h3>
        </header>
      )}

      <div className="mv-panel-body">
        {children}
      </div>

      {footer && (
        <footer className="mv-panel-footer">
          {footer}
        </footer>
      )}
    </section>
  );
}

export default Panel;