
import { useMemo, useState } from 'react';
import { useNotificationCount } from '@/lib/useNotificationCount';
import ProfilePage from '@/components/ProfilePage';
import SettingsPage from '@/components/SettingsPage';
import NotificationsPage from '@/components/NotificationsPage';
import SupportPage from '@/components/SupportPage';
import MessagesPage from '@/components/MessagesPage';
import BookingsPage from '@/components/BookingsPage';
import FindProsPage from '@/components/FindProsPage';

import type { AuthUser } from '@/App';
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  Hammer,
  Home,
  Mail,
  MapPin,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

type NavItem = {
  label: string;
  icon: typeof Home;
};

type Pro = {
  name: string;
  role: string;
  rating: string;
  price: string;
  image: string;
};

const mumbaiAreas = [
  'Panvel',
  'Vashi',
  'Nerul',
  'Airoli',
  'Thane',
  'Kopaikhairane',
  'Dombivali',
  'Kalyan',
  'Titwala',
];

const navItems: NavItem[] = [
  { label: 'Home', icon: Home },
  { label: 'Bookings', icon: CalendarDays },
  { label: 'Find Pros', icon: Search },
  { label: 'Messages', icon: Mail },
  { label: 'Profile', icon: UserRound },
];

const pros: Pro[] = [
  {
    name: 'Ravi S.',
    role: 'Master Electrician',
    rating: '4.9',
    price: '₹399',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDBvL--ztysb9JCMBVzFlvtPARHt7bkt0SFyC5b6-kjP0JjuoObITx8Ja-FHZjsS_VDsL7nOy4dlWHa3-mvCBDOY4fjNw7fUnop2plcrXHJQjVKCb_fq6eTMpfSK9YINn9djvy03vse91Hc2x8Pv_Cj0DM5Vl8Ulo2nK5NzyRJSy5Hr2CZSTmY5_IGmpbZ4oJW9HGE0DH9QomXHXqJEMFT4XbBDA9OCxUa6BsVC7-q5S54T-GPSCGcP',
  },
  {
    name: 'Priya M.',
    role: 'Interior Painting',
    rating: '5.0',
    price: '₹449',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDG4q23EEk9Olh1z00x0KksQOFxw8kSFh1Utw3P6VSk7nHnhj694OyOefLnp0hDgZagTNO9nRQGRJySWm-qkltILnoNXRtPVHLZSpyemMZo7Qzb7YGmsAeunDjRDvrscl05l79B3vvNkXzIyKH0JS2QMgFb8VG_X5L36jR_GA0jU56XEGAEmBp1NZETq2-fcyk8yISnFD24kVugfK3O4nGIdoNBlEqRh96YHUy2GqCB0lh4g4L2TXL1',
  },
  {
    name: 'Imran K.',
    role: 'AC Service Specialist',
    rating: '4.8',
    price: '₹599',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBpkFRZR7nxiXZyWPpU62hxmQTo_G17rdQ4mBOFo955cUzrkmIEpAHRf8DH-MVqnKDWRBYlInQq9OImLiC2EBZeh66LA_6Kbhfk8lmpKUnvpA1Q-dBpZkrfNwkYTSOZaTZv51ZuAn0v6Yf-pf1OrU1w2VYVx5Qm_UJ_3azB8d_4gUpGV2dYSzgfMc3HUC1zGDYJTN_H3g45WXdrjI-uqIZS-o0l9yovxwI2NBH3RW1zjX0x4C0Ao4kd',
  },
];

const serviceCategories = [
  { name: 'Electrician', icon: Zap },
  { name: 'Plumber', icon: Wrench },
  { name: 'Carpenter', icon: Hammer },
  { name: 'Cleaning', icon: Sparkles },
  { name: 'Painting', icon: Home },
  { name: 'Home Repair', icon: Settings },
  { name: 'Home Inspection', icon: ShieldCheck },
  { name: 'Appliance Repair', icon: BriefcaseBusiness },
];

const benefits = [
  {
    title: 'Verified Professionals',
    description:
      'Find service professionals for your everyday home maintenance needs.',
    icon: ShieldCheck,
  },
  {
    title: 'Easy Booking',
    description:
      'Explore available services and start your booking request in a few clicks.',
    icon: CalendarDays,
  },
  {
    title: 'Services in Your Area',
    description:
      'Choose your location to discover relevant home service options.',
    icon: MapPin,
  },
  {
    title: 'Convenient Support',
    description:
      'Get assistance when you need help finding the right service.',
    icon: BriefcaseBusiness,
  },
];

const homeCareTips = [
  {
    title: 'Keep electrical points safe',
    description:
      'Avoid overloaded sockets and get damaged switches checked by a qualified electrician.',
    tag: 'Electrical safety',
  },
  {
    title: 'Check for plumbing leaks',
    description:
      'Look under sinks and around taps regularly to identify leaks before they get worse.',
    tag: 'Plumbing',
  },
  {
    title: 'Maintain your AC',
    description:
      'Clean accessible filters regularly and arrange servicing when your AC needs attention.',
    tag: 'Appliance care',
  },
];

function Booking({
  title,
  detail,
  rating,
}: {
  title: string;
  detail: string;
  rating: number;
}) {
  return (
    <div className="booking-card">
      <div className="booking-top">
        <div>
          <h3>{title}</h3>
          <p>{detail}</p>
        </div>
        <span className="status">Completed</span>
      </div>

      <div className="booking-rating">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            size={15}
            fill={index < rating ? 'currentColor' : 'none'}
          />
        ))}
      </div>
    </div>
  );
}

type UserDashboardProps = {
  user: AuthUser;
  onSignOut: () => void;
};

export default function UserDashboard({
  user,
  onSignOut,
}: UserDashboardProps) {
  const [active, setActive] = useState('Home');
  const unreadNotificationCount = useNotificationCount();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [area, setArea] = useState('Panvel');
  const [areaOpen, setAreaOpen] = useState(false);
  const [areaSearch, setAreaSearch] = useState('');
  const [pendingChat, setPendingChat] = useState<{ conversationId: string; draft: string } | null>(null);

  const showNotice = (message: string) => setNotice(message);

  const displayName =
    user.fullName ||
    user.name ||
    user.email?.split('@')[0] ||
    'User';

  const avatarText = displayName
    .split(' ')
    .map((part) => part[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const filteredPros = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return pros;

    const serviceMatches: Record<string, string[]> = {
      electrician: ['electrician', 'electrical'],
      plumber: ['plumber', 'plumbing'],
      carpenter: ['carpenter', 'carpentry'],
      cleaning: ['cleaning', 'cleaner'],
      painting: ['painting', 'painter'],
      'home repair': ['repair', 'electrician', 'plumber'],
      'home inspection': ['inspection', 'home'],
      'appliance repair': ['ac', 'appliance', 'repair'],
    };

    const matchingTerms = Object.entries(serviceMatches).find(
      ([category]) => category.includes(query) || query.includes(category)
    )?.[1];

    return pros.filter((pro) => {
      const professionalInfo = `${pro.name} ${pro.role}`.toLowerCase();

      return (
        professionalInfo.includes(query) ||
        matchingTerms?.some((term) => professionalInfo.includes(term))
      );
    });
  }, [search]);

  const filteredAreas = useMemo(
    () =>
      mumbaiAreas.filter((name) =>
        name.toLowerCase().includes(areaSearch.toLowerCase())
      ),
    [areaSearch]
  );

  const selectService = (name: string) => {
    setSearch(name);
    setActive('Find Pros');
    showNotice(`Showing matching professionals for ${name}.`);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark">
            <Home size={19} strokeWidth={2.5} />
          </div>
          <span>HomeServe</span>

          <button
            type="button"
            className="close-menu"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              type="button"
              key={label}
              className={`nav-item ${active === label ? 'active' : ''}`}
              onClick={() => {
                setActive(label);
                if (label !== 'Messages') setPendingChat(null);
                setMenuOpen(false);
                setNotice('');
              }}
            >
              <Icon
                size={20}
                strokeWidth={active === label ? 2.5 : 1.8}
              />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="nav-item"
            onClick={() => {
              setActive('Settings');
              setMenuOpen(false);
              setNotice('');
            }}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>

          <div className="help-card">
            <span>Need a hand?</span>
            <button
              type="button"
              onClick={() => {
                setActive('Get Support');
                setMenuOpen(false);
                setNotice('');
              }}
            >
              Get support <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button
            type="button"
            className="menu-trigger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <label className="search-box">
            <Search size={19} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search services..."
              aria-label="Search services"
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </label>

          <div className="topbar-actions">
            {/* <div className={`location ${areaOpen ? 'location-open' : ''}`}>
              <span>Location</span>

              <button
                type="button"
                className="area-trigger"
                onClick={() => {
                  setAreaOpen((value) => !value);
                  setAreaSearch('');
                }}
                aria-label="Select area"
                aria-expanded={areaOpen}
              >
                <MapPin size={13} />
                <strong>{area}</strong>
                <ChevronRight
                  size={14}
                  className={`area-caret ${
                    areaOpen ? 'area-caret-open' : ''
                  }`}
                />
              </button>

              {areaOpen && (
                <div className="area-menu">
                  <label className="area-search">
                    <Search size={15} />
                    <input
                      autoFocus
                      value={areaSearch}
                      onChange={(event) =>
                        setAreaSearch(event.target.value)
                      }
                      placeholder="Search service areas"
                      aria-label="Search service areas"
                    />

                    {areaSearch && (
                      <button
                        type="button"
                        onClick={() => setAreaSearch('')}
                        aria-label="Clear area search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </label>

                  <ul role="listbox">
                    {filteredAreas.map((name) => (
                      <li key={name}>
                        <button
                          type="button"
                          className={area === name ? 'selected' : ''}
                          onClick={() => {
                            setArea(name);
                            setAreaOpen(false);
                            setAreaSearch('');
                            showNotice(
                              `Showing professionals in ${name}.`
                            );
                          }}
                          role="option"
                          aria-selected={area === name}
                        >
                          <MapPin size={14} /> {name}
                        </button>
                      </li>
                    ))}

                    {filteredAreas.length === 0 && (
                      <li className="no-areas">No areas found</li>
                    )}
                  </ul>
                </div>
              )}
            </div> */}

            <button
              type="button"
              className="icon-button notification-bell-button"
              onClick={() => { setActive('Notifications'); setNotice(''); }}
              aria-label="Notifications"
            >
              <Bell size={21} />
              {unreadNotificationCount > 0 && <span className="notification-count-badge">{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}</span>}
            </button>

            <button
              type="button"
              className="avatar"
              onClick={onSignOut}
              aria-label="Sign out"
              title="Sign out"
            >
              {avatarText}
            </button>
          </div>
        </header>

        <main className="content">
          {active === 'Bookings' ? (
            <BookingsPage
              userId={user.id != null ? String(user.id) : undefined}
              onExploreServices={() => {
                setActive('Find Pros');
                setSearch('');
                setNotice('');
              }}
              onOpenMessages={() => {
                setActive('Messages');
                setNotice('');
              }}
            />
          ) : active === 'Find Pros' ? (
            <FindProsPage
              userId={user.id != null ? String(user.id) : undefined}
              customerName={displayName}
              defaultArea={area}
              onBookingCreated={() => {
                setActive('Bookings');
                setNotice('Your booking has been created.');
              }}
              onOpenMessages={(conversationId, draft) => {
                setPendingChat({ conversationId, draft });
                setActive('Messages');
                setNotice('');
              }}
            />
          ) : active === 'Messages' ? (
            <MessagesPage
              userId={user.id != null ? String(user.id) : undefined}
              initialConversationId={pendingChat?.conversationId}
              initialDraft={pendingChat?.draft}
              onOpenBooking={(bookingRef) => {
                setActive('Bookings');
                setNotice(`Opening booking ${bookingRef}.`);
              }}
            />
          ) : active === 'Profile' ? (
            <ProfilePage user={user} />
          ) : active === 'Settings' ? (
            <SettingsPage user={user} />
          ) : active === 'Notifications' ? (
            <NotificationsPage onOpenSettings={() => setActive('Settings')} onOpenBooking={() => setActive('Bookings')} onOpenMessages={() => setActive('Messages')} />
          ) : active === 'Get Support' ? (
            <SupportPage />
          ) : (
            <>
          <section className="welcome">
            <div>
              <span className="eyebrow">Dashboard</span>
              <h1>Good morning, {displayName}</h1>
              <p>Everything you need to take care of your home, in one place.</p>
            </div>

            <button
              type="button"
              className="outline-button mobile-hide"
              onClick={() =>
                showNotice('Your home profile is up to date.')
              }
            >
              Manage home <ChevronRight size={16} />
            </button>
          </section>

          <p className="location-banner">
            <MapPin size={15} />
            Showing home service professionals in{' '}
            <strong>{area}</strong>
          </p>

          <div className="dashboard-grid">
            <div className="primary-column">
              <section className="section appointment-section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Your home</span>
                    <h2>Upcoming appointment</h2>
                  </div>
                </div>

                <div className="appointment-card">
                  <div className="appointment-icon">
                    <CalendarDays size={26} />
                  </div>

                  <div className="appointment-info">
                    <h3>Home service booking</h3>
                    <p>
                      Book a trusted professional for your home.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="dark-button"
                    onClick={() => {
                      setActive('Find Pros');
                      setSearch('');
                      showNotice('Choose a service to find a professional.');
                    }}
                  >
                    Book a service <ChevronRight size={16} />
                  </button>
                </div>
              </section>

              <section className="section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">What do you need?</span>
                    <h2>Quick Actions</h2>
                  </div>
                </div>

                <div className="service-grid">
                  {serviceCategories.map(({ name, icon: Icon }) => (
                    <button
                      type="button"
                      key={name}
                      className="service-card"
                      onClick={() => selectService(name)}
                    >
                      <span className="service-icon">
                        <Icon size={23} />
                      </span>
                      {name}
                    </button>
                  ))}
                </div>
              </section>

              <section className="section recommendations">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Handpicked for you</span>
                    <h2>Recommended professionals</h2>
                  </div>

                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      setActive('Find Pros');
                      setSearch('');
                    }}
                  >
                    View all <ChevronRight size={16} />
                  </button>
                </div>

                <div className="pro-grid">
                  {filteredPros.map((pro) => (
                    <article className="pro-card" key={pro.name}>
                      <img src={pro.image} alt={pro.name} />

                      <div className="pro-copy">
                        <h3>{pro.name}</h3>
                        <p>{pro.role}</p>
                      </div>

                      <div className="pro-footer">
                        <span className="rating">
                          <Star size={15} fill="currentColor" />{' '}
                          {pro.rating}
                        </span>

                        <span className="price">
                          {pro.price}
                          <span className="from">/visit</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        className="small-button pro-cta"
                        onClick={() =>
                          showNotice(
                            `Booking request for ${pro.name}. Connect a booking API to submit it.`
                          )
                        }
                      >
                        Book now
                      </button>
                    </article>
                  ))}

                  {filteredPros.length === 0 && (
                    <p className="empty-state">
                      No matching professionals found. Try another search.
                    </p>
                  )}
                </div>
              </section>

              <section className="section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">The HomeServe difference</span>
                    <h2>Why Choose HomeServe?</h2>
                  </div>
                </div>

                <div className="service-grid">
                  {benefits.map(({ title, description, icon: Icon }) => (
                    <article className="service-card" key={title}>
                      <span className="service-icon">
                        <Icon size={23} />
                      </span>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Helpful ideas for your home</span>
                    <h2>Home Care Tips</h2>
                  </div>
                </div>

                <div className="pro-grid">
                  {homeCareTips.map((tip) => (
                    <article className="pro-card" key={tip.title}>
                      <div className="pro-copy">
                        <span className="eyebrow">{tip.tag}</span>
                        <h3>{tip.title}</h3>
                        <p>{tip.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <aside className="right-column">
              <section className="section recent-section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Your activity</span>
                    <h2>Recent bookings</h2>
                  </div>

                  <button
                    type="button"
                    className="history-button"
                    onClick={() => {
                      setActive('Bookings');
                      showNotice('Your booking history is displayed here.');
                    }}
                  >
                    History <ChevronRight size={15} />
                  </button>
                </div>

                <Booking
                  title="Home cleaning"
                  detail="Completed recently"
                  rating={5}
                />

                <Booking
                  title="Electrical repair"
                  detail="Completed recently"
                  rating={4}
                />
              </section>

              <section className="section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Need assistance?</span>
                    <h2>We're here to help</h2>
                  </div>
                </div>

                <p className="help-copy">
                  Find the right home professional for your needs. Our
                  dashboard makes it easy to explore services and get started.
                </p>

                <button
                  type="button"
                  className="dark-button"
                  onClick={() => {
                    setActive('Get Support');
                    setNotice('');
                  }}
                >
                  Get help <ChevronRight size={16} />
                </button>
              </section>

              <section className="section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Your home checklist</span>
                    <h2>Quick Reminders</h2>
                  </div>
                </div>

                <p className="help-copy">
                  Check taps for leaks, keep electrical sockets safe, and
                  schedule appliance maintenance when required.
                </p>

                <button
                  type="button"
                  className="outline-button"
                  onClick={() =>
                    showNotice('Your home maintenance checklist is ready to use.')
                  }
                >
                  View reminders <ChevronRight size={16} />
                </button>
              </section>
            </aside>
          </div>
            </>
          )}
        </main>
      </div>

      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice('')}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
