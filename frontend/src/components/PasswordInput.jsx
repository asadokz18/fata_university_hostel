// Password field with the eye toggle (togglePwd() in the original pages)
import { useState } from 'react';

export default function PasswordInput({ id, value, onChange, placeholder, style, icon, autoComplete, onKeyDown }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-group">
      {icon && <i className={`fas fa-${icon} input-icon`}></i>}
      <input
        type={show ? 'text' : 'password'}
        className="form-control"
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={style}
        autoComplete={autoComplete}
        onKeyDown={onKeyDown}
      />
      <button type="button" className="toggle-pwd" onClick={() => setShow(s => !s)}>
        <i className={`fas ${show ? 'fa-eye-slash' : 'fa-eye'}`}></i>
      </button>
    </div>
  );
}
