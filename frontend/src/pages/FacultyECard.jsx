// faculty/faculty_ecard.html
import Page from '../components/Page';
import ECardView from '../components/ECardView';

export default function FacultyECard() {
  return (
    <Page styles={['style.css', 'faculty_ecard.css']} title="Faculty Digital E-Card — FATA University Hostel">
      <ECardView faculty />
    </Page>
  );
}
