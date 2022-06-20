import reset from '@unocss/reset/tailwind.css';
import unocss from '@/uno.css';
import {
  json,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
  useLoaderData,
  useMatches,
} from 'remix';
import type { MetaFunction, LinksFunction, LoaderFunction } from 'remix';
import { LoadCtx } from 'types';
import Gun, { ISEAPair } from 'gun';
import Display from '../components/DisplayHeading';
import {
  ExternalScripts,
  ExternalScriptsFunction,
} from '~/remix-gun-utility/remix/external-scripts';
import jsesc from 'jsesc';

export const links: LinksFunction = () => {
  return [
    {
      rel: 'stylesheet',
      href: unocss,
    },
    {
      rel: 'stylesheet',
      href: reset,
    },
  ];
};
export let loader: LoaderFunction = async ({ params, request, context }) => {
  let { RemixGunContext } = context as LoadCtx;
  let { ENV, gun } = RemixGunContext(Gun, request);
  let user = gun.user();

  let meta;
  try {
    meta = await user.auth(ENV.APP_KEY_PAIR).path(`pages.root.meta`).then();
  } catch (error) {}
  let gunOpts = {
    peers: (ENV.PEER_DOMAIN as string[]).map((peer) => `https://${peer}/gun`),
    radisk: true,
    localStorage: false,
  };

  return json<RootLoaderData>({
    meta,
    gunOpts,
    ENV,
  });
};
export type RootLoaderData = {
  meta: Record<string, string> | undefined;
  gunOpts: {
    peers: string[];
    radisk: boolean;
    localStorage: boolean;
  };
  ENV: {
    DOMAIN: string | undefined;
    PEER_DOMAIN: string[] | undefined;
    CLIENT: string | undefined;
    APP_KEY_PAIR: ISEAPair;
  };
};

/** Dynamically load meta tags from root loader*/
export const meta: MetaFunction = () => {
  const matches = useMatches();
  let root = matches.find((match) => match.id === 'root');
  const metaDoc: Record<string, string> = root?.data?.meta;
  return metaDoc;
};
export type MenuLinks = {
  id: string;
  link: string;
  label: string;
  icon?: string;
  subMenu?: MenuLinks;
}[];
export let handle: { links: MenuLinks; scripts: ExternalScriptsFunction } = {
  links: [
    {
      label: 'HOME',
      id: 'home',
      link: '/',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
    },
  ],
  scripts: () => [],
};

export default function App() {
  let { ENV } = useLoaderData();
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width,initial-scale=1' />
        <Meta />
        <Links />
      </head>
      <body className='bg-slate-500'>
        <Outlet />

        <ScrollRestoration />
        <Scripts />
        <ExternalScripts />
        {process.env.NODE_ENV === 'development' && <LiveReload />}
      </body>
    </html>
  );
}

export function CatchBoundary() {
  let caught = useCatch();

  switch (caught.status) {
    case 401:
    case 403:
    case 404:
      return (
        <div className='min-h-screen py-4 flex flex-col justify-center items-center'>
          <Display
            title={`${caught.status}`}
            titleColor='white'
            span={`${caught.statusText}`}
            spanColor='pink-500'
            description={`${caught.statusText}`}
          />
        </div>
      );
  }
  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className='min-h-screen py-4 flex flex-col justify-center items-center'>
      <Display
        title='Error:'
        titleColor='#cb2326'
        span={error.message}
        spanColor='#fff'
        description={`error`}
      />
    </div>
  );
}
