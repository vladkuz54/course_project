function NodeStyle({ nodeDatum }) {
    const isRed = nodeDatum.nodeSvgShape.shapeProps.fill === 'red';
    const isNil = nodeDatum.name === 'NIL';
    const isDeleting = nodeDatum.nodeSvgShape.shapeProps.isDeleting;

    return (
        <g
            id={nodeDatum.attributes.id}
            className={`node ${isNil ? 'nil-node' : ''} ${isDeleting ? 'animate-delete' : ''}`}
        >
            <circle
                r={20}
                fill={isNil ? 'black' : isRed ? 'red' : 'black'}
                stroke={isNil ? 'black' : 'black'}
                strokeWidth={2}
                className={nodeDatum.nodeSvgShape.shapeProps.isNew ? 'animate-node' : ''}
            />
            <text
                fill={'white'}
                stroke="none"
                x={0}
                y={4}
                style={{ fontSize: '15px' }}
                textAnchor="middle"
                className={nodeDatum.nodeSvgShape.shapeProps.isNew ? 'animate-node' : ''}
            >
                {isNil ? 'NIL' : nodeDatum.name}
            </text>
        </g>
    );
};

export default NodeStyle;
