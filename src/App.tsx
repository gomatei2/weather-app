/* eslint-disable no-restricted-syntax */
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { FiRefreshCw, FiSearch, FiTrash } from 'react-icons/fi';

import 'react-toastify/dist/ReactToastify.css';
import './styles/global.scss';

interface City {
  main: {
    temp: number;
  };
  name: string;
  sys: {
    country: string;
  };
  weather: [
    {
      description: string;
      icon: string;
    }
  ];
  icon: string;
}

const App: React.FC = () => {
  const [citys, setCitys] = useState<City[]>([]);
  const [inputCity, setInputCity] = useState('');

  const loadStorageCitys = useCallback(async () => {
    const storageCitysJson = localStorage.getItem('citys');

    if (!storageCitysJson) {
      return;
    }

    const storageCitys = JSON.parse(storageCitysJson);

    const newCitys: City[] = [];

    for await (const cityName of storageCitys) {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${process.env.REACT_APP_API_KEY}&units=metric`
      );

      const data: City = await response.json();

      const { main, name, sys, weather } = data;
      const icon = `https://s3-us-west-2.amazonaws.com/s.cdpn.io/162656/${weather[0].icon}.svg`;

      newCitys.push({ main, name, sys, weather, icon });
    }

    setCitys(newCitys);
    toast('Storage cards loaded!', { type: 'info' });
  }, []);

  useEffect(() => {
    loadStorageCitys();
  }, [loadStorageCitys]);

  const setLocalStorageItems = (newCitys: City[]) => {
    localStorage.setItem(
      'citys',
      JSON.stringify(newCitys.map(city => city.name))
    );
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();

    if (!inputCity) {
      toast('Enter a valid city!', { type: 'error' });
      return;
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${inputCity}&appid=${process.env.REACT_APP_API_KEY}&units=metric`
      );

      if (response.status === 404) {
        setInputCity('');
        throw new Error('City ​​not found.');
      }

      const data: City = await response.json();

      const { main, name, sys, weather } = data;

      if (citys.find(city => city.name === name)) {
        toast('City already searched!', { type: 'warning' });
        return;
      }

      const icon = `https://s3-us-west-2.amazonaws.com/s.cdpn.io/162656/${weather[0].icon}.svg`;

      const newCitys = [...citys, { main, name, sys, weather, icon }];
      setCitys(newCitys);
      setInputCity('');

      setLocalStorageItems(newCitys);
      toast(`${name} card saved!`, { type: 'success' });
    } catch (error) {
      toast(error.message, { type: 'error' });
    }
  };

  const handleRefreshCity = async (cityName: string) => {
    const refreshCity = citys.find(city => city.name === cityName);

    if (!refreshCity) {
      return;
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${process.env.REACT_APP_API_KEY}&units=metric`
    );

    const data: City = await response.json();

    const { main, name, sys, weather } = data;
    const icon = `https://s3-us-west-2.amazonaws.com/s.cdpn.io/162656/${weather[0].icon}.svg`;

    const refreshedCity = { main, name, sys, weather, icon };

    const refreshedCitys = citys.map(city => {
      if (city.name === name) {
        return refreshedCity;
      }

      return city;
    });

    setCitys(refreshedCitys);
    setLocalStorageItems(refreshedCitys);
    toast(`${name} card updated!`, { type: 'success' });
  };

  const handleDeleteCity = (cityName: string) => {
    const filteredCitys = citys.filter(city => city.name !== cityName);
    setCitys(filteredCitys);
    setLocalStorageItems(filteredCitys);
    toast(`${cityName} card deleted!`, { type: 'success' });
  };

  return (
    <div className="container">
      <h1>Weather App</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Search for a city"
          value={inputCity}
          onChange={e => {
            setInputCity(e.target.value);
          }}
        />
        <button type="submit">
          Search <FiSearch />
        </button>
      </form>
      <section>
        {citys.map(city => (
          <div key={city.name}>
            <main>
              <div>
                <span>{city.name}</span>
                <sup>{city.sys.country}</sup>
              </div>
              <div>
                <FiRefreshCw onClick={() => handleRefreshCity(city.name)} />
                <FiTrash onClick={() => handleDeleteCity(city.name)} />
              </div>
            </main>
            <aside>
              {Math.round(city.main.temp)}
              <sup>°C</sup>
            </aside>
            <figure>
              <img src={city.icon} alt={city.weather[0].description} />
              <figcaption>{city.weather[0].description}</figcaption>
            </figure>
          </div>
        ))}
      </section>
      <ToastContainer />
    </div>
  );
};

export default App;
