// student/student_id_card.html
import Page from '../components/Page';
import IdCardView from '../components/IdCardView';

export default function StudentIdCard() {
  return (
    <Page styles={['style.css', 'student_id_card.css']} title="Student ID Card — FATA University Hostel">
      <IdCardView faculty={false} />
    </Page>
  );
}
