import React from 'react';
import Img from '@theme-original/MDXComponents/Img';

export default function ImgWrapper(props) {
    const uniquid = props.src;

    return (
        <span>
            <span className={'image'}>
                <Img {...props} />
            </span>
            <span className={'lightbox-image'}>
                <a href={ '#screen-' + uniquid} >
                    <img className="lightbox-thumbnail" src={props.src} alt={props.alt} />
                </a>

                <a href="#_" className="lightbox" id={ 'screen-' + uniquid}>
                    <img src={props.src} alt={props.alt} />
                </a>
            </span>
        </span>
    );
}
