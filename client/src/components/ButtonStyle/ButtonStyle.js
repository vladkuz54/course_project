import React from "react";
import "./ButtonStyle.css";


function ButtonStyle({ text, onClick }) {
    return (
        <button onClick={onClick} className="buttonStyle">{text}</button>
    );
}

export default ButtonStyle;