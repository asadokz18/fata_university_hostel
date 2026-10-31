// Small shared pieces used by the admin sections
export const Loading = ({ cols }) => (
  <tr><td colSpan={cols} className="no-data"><div className="spinner"></div></td></tr>
);
export const NoData = ({ cols, children }) => (
  <tr><td colSpan={cols} className="no-data">{children}</td></tr>
);
export const Badge = ({ cls, children }) => <span className={`badge-status badge-${cls}`}>{children}</span>;

export const Msg = ({ a }) => (a ? <div className={`alert alert-${a.type}`}>{a.msg}</div> : null);

export const roleBadge = role => (role === 'Faculty' ? 'important' : 'approved');
export const genderBadge = g => (g === 'Male' ? 'approved' : 'pending');
