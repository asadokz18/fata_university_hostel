// student/student_ecard.html
import Page from '../components/Page';
import ECardView from '../components/ECardView';

export default function StudentECard() {
  return (
    <Page styles={['style.css', 'student_ecard.css']} title="Digital E-Card — FATA University Hostel">
      <ECardView faculty={false} />
    </Page>
  );
}
