"use client";

import { Lightbulb, Plus } from "lucide-react";
import { Fragment } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function FeaturesPage() {
  // This will be replaced with actual features data
  const hasFeatures = false;

  return (
    <Fragment>
      {hasFeatures ? (
        <div className={"space-y-4"}>{/* Feature list will go here */}</div>
      ) : (
        <EmptyState
          action={
            <Button>
              <Plus className={"size-4"} />
              Add feature request
            </Button>
          }
          description={
            "Feature requests help you plan and track implementation ideas for this project."
          }
          icon={<Lightbulb className={"size-6"} />}
          title={"No feature requests yet"}
        />
      )}
    </Fragment>
  );
}
