
import ReadingTest from '../../../../../components/tests/ReadingTest';
import WritingTest from '../../../../../components/tests/WritingTest';
import AudioTest from '../../../../../components/tests/AudioTest';

export default async function ModulePage({ params }) {
    const { name } = await params; // ✅ unwrap the Promise

    return (
        <div>
            <h1>Module: {name}</h1> 
            {name === 'reading' && <ReadingTest />}
            {name === 'writing' && <WritingTest />}
            {name === 'audio' && <AudioTest />}
        </div>
    );
}
