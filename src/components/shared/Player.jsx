
'use client';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

const Player = ({src}) => (

    <AudioPlayer
        autoPlay={false}
        src={src}
        onPlay={e => console.log("onPlay")}
        className='w-96'
    />
);

export default Player;