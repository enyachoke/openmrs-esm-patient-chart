import React, { useState, useMemo } from 'react';
import styles from './visit-type-overview.scss';
import debounce from 'lodash-es/debounce';
import isEmpty from 'lodash-es/isEmpty';
import { Search, RadioButtonGroup, RadioButton } from 'carbon-components-react';
import { PatientChartPagination } from '@openmrs/esm-patient-common-lib';
import { useTranslation } from 'react-i18next';
import { useLayoutType, usePagination, useVisitTypes } from '@openmrs/esm-framework';

interface VisitTypeOverviewProps {
  onChange: (event) => void;
}

const VisitTypeOverview: React.FC<VisitTypeOverviewProps> = ({ onChange }) => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const visitTypes = useVisitTypes();
  const [searchTerm, setSearchTerm] = useState<string>('');

  const searchResults = useMemo(() => {
    if (!isEmpty(searchTerm)) {
      return visitTypes.filter((visitType) => visitType.display.toLowerCase().search(searchTerm.toLowerCase()) !== -1);
    } else {
      return visitTypes;
    }
  }, [searchTerm, visitTypes]);

  const handleSearch = React.useMemo(() => debounce((searchTerm) => setSearchTerm(searchTerm), 300), []);

  const { results, currentPage, goTo } = usePagination(searchResults, 5);

  return (
    <div className={`${styles.visitTypeOverviewWrapper} ${isTablet ? styles.tablet : styles.desktop}`}>
      <Search
        onChange={(event) => handleSearch(event.target.value)}
        placeholder={t('searchForAVisitType', 'Search for a visit type')}
        labelText=""
        light={isTablet}
      />
      <RadioButtonGroup
        className={styles.radioButtonGroup}
        defaultSelected="default-selected"
        orientation="vertical"
        onChange={onChange}
        name="radio-button-group"
        valueSelected="default-selected"
      >
        {results.map(({ uuid, display, name }) => (
          <RadioButton key={uuid} className={styles.radioButton} id={name} labelText={display} value={uuid} />
        ))}
      </RadioButtonGroup>
      <div className={styles.paginationContainer}>
        <PatientChartPagination
          pageNumber={currentPage}
          pageUrl={null}
          totalItems={visitTypes?.length}
          currentItems={results.length}
          pageSize={5}
          onPageNumberChange={({ page }) => goTo(page)}
        />
      </div>
    </div>
  );
};

export default VisitTypeOverview;
