import React from "react";
import "./MainPage.css";
import ButtonStyle from "../../components/ButtonStyle/ButtonStyle.js";
import { Link } from "react-router-dom";


function MainPage() {
    return (
        <div className="mainPage">
            <div className="mainPage__content">
                <div className="mainPage__content-graph">
                    <article>
                        Depth-first search
                    </article>
                    <Link to="/graph">
                        <ButtonStyle text="Start" />
                    </Link>  
                </div>
                <div className="mainPage__content-data-structure">
                    <article>
                        Red-black tree
                    </article>
                    <Link to="/data">
                        <ButtonStyle text="Start" />
                    </Link>
                </div>
            </div>
            <footer>
                <p>Internet of Things</p>
                <p>2024</p>
            </footer>
        </div>
    );
}

export default MainPage;