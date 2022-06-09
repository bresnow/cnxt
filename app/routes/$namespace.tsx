import { Suspense } from "react";
import Gun from "gun";
import {
  ActionFunction,
  json,
  LoaderFunction,
  useLoaderData,
  useActionData,
  useCatch,
  Outlet,
  useParams,
} from "remix";
import { DeferedData, useDeferedLoaderData } from "~/dataloader/lib";
import { useIf } from "bresnow_utility-react-hooks";
import { LoadCtx } from "types";
import { Card } from "~/components/Card";
import Display from "~/components/DisplayHeading";
import { useGunStatic } from "~/lib/gun/hooks";
import FormBuilder from "~/components/FormBuilder";

import React from "react";
import { HashtagLarge } from "~/components/svg/Icons";
import { InputTextProps } from "~/components/InputText";
import CNXTLogo from "~/components/svg/logos/CNXT";
import { Navigation } from "~/components/Navigator";
import { SuspendedTest } from "./$namespace/edit";
import main from "~/runner";

export function Fallback({ defered }: { defered: DeferedData }) {
  return (
    <div className="grid grid-cols-1 gap-4 p-4">
      <div className="col-span-1">
        <h5>Cached Data From Radisk/ IndexedDB</h5>
        {defered.cached &&
          Object.entries(defered.cached).map((val) => {
            let [key, value] = val;
            if (key === "_") {
              return;
            }
            return (
              <div
                key={key}
                className="flex animate-pulse flex-row items-center space-y-5 justify-center space-x-5"
              >
                <div className="w-1/3 p-5 rounded-md ">{key}</div>
                <div className="w-1/2 bg-gray-300 p-5 rounded-md flex-wrap">
                  {`${value}`}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

type ErrObj = {
  _key?: string | undefined;
  _value?: string | undefined;
  _form?: string | undefined;
};
type LoadError = {
  error: ErrObj;
};
export let loader: LoaderFunction = async ({ params, request, context }) => {
  let { RemixGunContext } = context as LoadCtx;
  let { gun, seaAuth } = RemixGunContext(Gun, request);

  let namespace = params.namespace as string;
  let data;
  try {
    let _data = await gun.get(namespace).then();

    data = { namespace, ..._data };
  } catch (error) {
    data = { error };
  }
  return json(data);
};

export default function NameSpaceRoute() {
  let namespace = useParams().namespace as string;
  let defered = useDeferedLoaderData(`/api/gun/q?`, {
    params: { path: namespace },
  });

  let searchProps: InputTextProps = {
    value: namespace,
    placeholder: namespace,
    icon: <HashtagLarge className={`${"fill-primary"} `} />,
    className:
      "w-full bg-transparent text-primary py-2 group placeholder:text-primary focus:outline-none rounded-md flex",
  };
  return (
    <Navigation search={searchProps} logo={<CNXTLogo />}>
      <Suspense fallback={<Fallback defered={defered} />}>
        <SuspendedTest load={defered.load} />
      </Suspense>
      <Outlet />
    </Navigation>
  );
}

export function CatchBoundary() {
  let caught = useCatch();

  switch (caught.status) {
    case 401:
    case 403:
    case 404:
      return (
        <div className="min-h-screen py-4 flex flex-col justify-center items-center">
          <Display
            title={`${caught.status}`}
            titleColor="white"
            span={`${caught.statusText}`}
            spanColor="pink-500"
            description={`${caught.statusText}`}
          />
        </div>
      );
  }
  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error.message);
  console.trace(error.message);
  return (
    <div className="min-h-screen py-4 flex flex-col justify-center items-center">
      <Display
        title="Error:"
        titleColor="#cb2326"
        span={error.message}
        spanColor="#fff"
        description={`error`}
      />
    </div>
  );
}
