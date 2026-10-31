// faculty/faculty_id_card.html
import Page from '../components/Page';
import IdCardView from '../components/IdCardView';

export default function FacultyIdCard() {
  return (
    <Page styles={['style.css', 'faculty_id_card.css']} title="Faculty ID Card — FATA University Hostel">
      <IdCardView faculty={true} />
    </Page>
  );
}
