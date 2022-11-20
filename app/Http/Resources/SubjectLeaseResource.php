<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SubjectLeaseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        // return parent::toArray($request);
        return [
            'id' => $this->leaseTypeCode,
            'leaseType' => $this->leaseType,
            'leaseStatus' => $this->leaseStatus,
            'userAdded' => $this->userAdded,
            'dateAdded' => $this->dateAdded,
            'userUpdated' => $this->userUpdated,
            'dateUpdated' => $this->dateUpdated,
        ];
    }
}
