import React from "react";  
import "./InputStyle.css";

function InputStyle({ type, placeholder, value, onChange, min, max, onKeyDown }) {
    return (
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            onKeyDown={onKeyDown}
        />
    );
}

export default InputStyle;